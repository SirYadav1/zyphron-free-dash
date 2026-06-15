import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { User } from '../entities/user.entity';
import { Server } from '../entities/server.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import { PterodactylService } from '../pterodactyl/pterodactyl.service';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    private mailService: MailService,
    private pterodactylService: PterodactylService,
  ) {}

  // pkce: verifier stays local, challenge goes to discord
  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32)
      .toString('base64url')
      .substring(0, 128);
    // create SHA256 hash of code_verifier for code_challenge
    const codeChallenge = crypto.createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    return { codeVerifier, codeChallenge };
  }

  getOAuthUrl(state: string, codeChallenge?: string): string {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_CALLBACK_URL;
    const scopes = ['identify', 'guilds.join'];
    let url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&response_type=code&scope=${scopes.join('%20')}&state=${encodeURIComponent(state)}`;
    // send the challenge when pkce is on
    if (codeChallenge) {
      url += `&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`;
    }
    return url;
  }

  async handleCallback(code: string, userId: string, codeVerifier?: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const tokenResponse = await this.exchangeCode(code, codeVerifier);
    const discordUser = await this.getDiscordUser(tokenResponse.access_token);

    const isMember = await this.isUserInGuild(discordUser.id);
    if (!isMember) {
      throw new HttpException(
        'You must join our Discord server before linking your account.',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingUser = await this.userRepo.findOne({
      where: { discord_id: discordUser.id },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new HttpException(
        'Discord account already linked to another user',
        HttpStatus.CONFLICT,
      );
    }

    let pteroUserId = user.pterodactyl_user_id;
    let pteroUsername = user.pterodactyl_username;

    if (!pteroUserId) {
      const email = user.email;

      if (!email) {
        throw new HttpException(
          'User email not found',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        let pteroUser = await this.pterodactylService.getUserByEmail(email);

        if (!pteroUser) {
          const newPassword = crypto.randomBytes(16).toString('hex');
          pteroUser = await this.pterodactylService.createUser({
            username: user.username,
            email: email,
            password: newPassword,
          });
        }

        pteroUserId = pteroUser.attributes?.id;
        pteroUsername = pteroUser.attributes?.username || user.username;
      } catch (error) {
        this.logger.error(
          'Failed to create Pterodactyl user during Discord link:',
          error,
        );
      }
    }

    const wasPreviouslyLinked = !!user.discord_id;

    await this.userRepo.update(userId, {
      discord_id: discordUser.id,
      discord_username: discordUser.username,
      discord_left_at: null,
      pterodactyl_user_id: pteroUserId,
      pterodactyl_username: pteroUsername,
    });

    if (!wasPreviouslyLinked) {
      await this.awardDiscordLinkBonus(userId, discordUser.username);
    }

    const suspendedServers = await this.serverRepo.find({
      where: { user_id: userId, status: 'suspended' },
    });

    if (suspendedServers) {
      for (const server of suspendedServers) {
        if (server.pterodactyl_server_id) {
          try {
            await this.pterodactylService.unsuspendServer(
              server.pterodactyl_server_id,
            );
          } catch (error) {
            this.logger.error(
              `Failed to unsuspend Pterodactyl server ${server.pterodactyl_server_id}:`,
              error,
            );
          }
        }
        await this.serverRepo.update(server.id, { status: 'active' });
      }
    }

    return {
      message: 'Discord account linked successfully',
      discordId: discordUser.id,
      discordUsername: discordUser.username,
    };
  }

  async unlink(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { discord_id: true },
    });
    if (!user || !user.discord_id) {
      throw new HttpException(
        'Discord account not linked',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userRepo.update(userId, {
      discord_id: null,
      discord_username: null,
      discord_left_at: new Date().toISOString(),
    });

    await this.suspendAllUserServers(userId, 'Discord account unlinked');
  }

  async getStatus(userId: string): Promise<{
    linked: boolean;
    discordId: string | null;
    discordUsername: string | null;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return {
      linked: !!user.discord_id,
      discordId: user.discord_id,
      discordUsername: user.discord_username,
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkDiscordMembership() {
    this.logger.log('Running Discord membership check...');

    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !botToken) {
      this.logger.warn('Discord guild ID or bot token not configured');
      return;
    }

    let guildMemberIds: Set<string>;
    try {
      const members = await this.fetchGuildMembers(guildId, botToken);
      guildMemberIds = new Set(members.map((m: any) => m.user.id));
    } catch (error) {
      this.logger.error('Failed to fetch guild members:', error);
      return;
    }

    const actualLinkedUsers = await this.userRepo.find({
      where: { discord_id: Not(IsNull()) },
    });

    for (const user of actualLinkedUsers) {
      if (!user.discord_id) continue;

      const isInGuild = guildMemberIds.has(user.discord_id);

      if (!isInGuild && !user.discord_left_at) {
        this.logger.log(
          `User ${user.username} (${user.discord_id}) left Discord guild`,
        );
        await this.userRepo.update(user.id, {
          discord_left_at: new Date().toISOString(),
        });
        await this.suspendAllUserServers(user.id, 'Left Discord server');
      } else if (isInGuild && user.discord_left_at) {
        this.logger.log(
          `User ${user.username} (${user.discord_id}) rejoined Discord guild`,
        );
        await this.userRepo.update(user.id, { discord_left_at: null });
        await this.unsuspendAllUserServers(user.id);
      }
    }
  }

  private async suspendAllUserServers(
    userId: string,
    reason: string,
  ): Promise<void> {
    const activeServers = await this.serverRepo.find({
      where: { user_id: userId, status: 'active' },
    });

    if (activeServers) {
      for (const server of activeServers) {
        if (server.pterodactyl_server_id) {
          try {
            await this.pterodactylService.suspendServer(
              server.pterodactyl_server_id,
            );
          } catch (error) {
            this.logger.error(
              `Failed to suspend Pterodactyl server ${server.pterodactyl_server_id}:`,
              error,
            );
          }
        }
        await this.serverRepo.update(server.id, { status: 'suspended' });
      }
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user && user.email && activeServers && activeServers.length > 0) {
      try {
        for (const server of activeServers) {
          await this.mailService.sendServerSuspension(
            user.email,
            server.server_name,
            reason,
          );
        }
      } catch (error) {
        this.logger.error('Failed to send suspension email:', error);
      }
    }
  }

  private async unsuspendAllUserServers(userId: string): Promise<void> {
    const suspendedServers = await this.serverRepo.find({
      where: { user_id: userId, status: 'suspended' },
    });

    if (suspendedServers) {
      for (const server of suspendedServers) {
        if (server.pterodactyl_server_id) {
          try {
            await this.pterodactylService.unsuspendServer(
              server.pterodactyl_server_id,
            );
          } catch (error) {
            this.logger.error(
              `Failed to unsuspend Pterodactyl server ${server.pterodactyl_server_id}:`,
              error,
            );
          }
        }
        await this.serverRepo.update(server.id, { status: 'active' });
      }
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user && user.email && suspendedServers && suspendedServers.length > 0) {
      try {
        for (const server of suspendedServers) {
          await this.mailService.sendServerUnsuspension(
            user.email,
            server.server_name,
          );
        }
      } catch (error) {
        this.logger.error('Failed to send unsuspension email:', error);
      }
    }
  }

  private async exchangeCode(code: string, codeVerifier?: string): Promise<any> {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = process.env.DISCORD_CALLBACK_URL;

    const params: Record<string, string> = {
      client_id: clientId || '',
      client_secret: clientSecret || '',
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || '',
    };
    // verifier goes back on the token exchange
    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpException(
        `Discord OAuth error: ${errorText}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return await response.json();
  }

  private async getDiscordUser(accessToken: string): Promise<any> {
    const response = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new HttpException(
        'Failed to fetch Discord user',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await response.json();
  }

  private async fetchGuildMembers(
    guildId: string,
    botToken: string,
  ): Promise<any[]> {
    const members: any[] = [];
    let after: string | undefined;

    while (true) {
      const params = new URLSearchParams({ limit: '1000' });
      if (after) params.set('after', after);

      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members?${params}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
        },
      );

      if (!response.ok) {
        throw new HttpException(
          `Discord API error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const batch: any[] = await response.json();
      members.push(...batch);

      if (batch.length < 1000) break;
      after = batch[batch.length - 1].user.id;
    }

    return members;
  }

  private async isUserInGuild(discordId: string): Promise<boolean> {
    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!guildId || !botToken) return false;

    try {
      const response = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
        {
          headers: { Authorization: `Bot ${botToken}` },
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async awardDiscordLinkBonus(
    userId: string,
    discordUsername: string,
  ): Promise<void> {
    const setting = await this.settingRepo.findOne({
      where: { key: 'discord_link_bonus' },
    });
    const bonusAmount = setting ? parseInt(setting.value) : 50;

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { coins: true },
    });

    if (!user) return;

    const updateResult = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coins: user.coins + bonusAmount })
      .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
      .execute();

    if (!updateResult.affected) {
      this.logger.warn(`Discord bonus coin update failed for user ${userId}`);
      return;
    }

    await this.transactionRepo.save(
      this.transactionRepo.create({
        user_id: userId,
        type: 'discord_link',
        amount: bonusAmount,
        description: `Discord account linked (${discordUsername})`,
      }),
    );

    this.logger.log(
      `Awarded Discord link bonus of ${bonusAmount} coins to user ${userId}`,
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Server } from '../entities/server.entity';
import { AfkSession } from '../entities/afk-session.entity';
import { DailyLogin } from '../entities/daily-login.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  private readonly ACHIEVEMENTS = {
    first_login: {
      key: 'first_login',
      name: 'First Steps',
      description: 'Login for the first time',
      reward: 10,
      check: async (user: any, context: any) => true,
    },
    discord_linked: {
      key: 'discord_linked',
      name: 'Discord Connected',
      description: 'Link your Discord account',
      reward: 50,
      check: async (user: any, context: any) => !!user.discord_id,
    },
    first_server: {
      key: 'first_server',
      name: 'Server Owner',
      description: 'Create your first server',
      reward: 100,
      check: async (user: any, context: any) => {
        const count = await context.serverRepo.count({
          where: { user_id: user.id },
        });
        return count >= 1;
      },
    },
    five_servers: {
      key: 'five_servers',
      name: 'Server Collector',
      description: 'Own 5 servers',
      reward: 200,
      check: async (user: any, context: any) => {
        const count = await context.serverRepo.count({
          where: { user_id: user.id },
        });
        return count >= 5;
      },
    },
    ten_servers: {
      key: 'ten_servers',
      name: 'Server Empire',
      description: 'Own 10 servers',
      reward: 500,
      check: async (user: any, context: any) => {
        const count = await context.serverRepo.count({
          where: { user_id: user.id },
        });
        return count >= 10;
      },
    },
    afk_hour: {
      key: 'afk_hour',
      name: 'AFK Beginner',
      description: 'Earn coins through AFK for 1 hour total',
      reward: 50,
      check: async (user: any, context: any) => {
        const sessions = await context.afkSessionRepo.find({
          where: { user_id: user.id },
          select: { total_visible_seconds: true },
        });
        const totalSeconds =
          sessions?.reduce(
            (acc, s) => acc + (s.total_visible_seconds || 0),
            0,
          ) || 0;
        return totalSeconds >= 3600;
      },
    },
    afk_day: {
      key: 'afk_day',
      name: 'AFK Dedicated',
      description: 'Earn coins through AFK for 24 hours total',
      reward: 200,
      check: async (user: any, context: any) => {
        const sessions = await context.afkSessionRepo.find({
          where: { user_id: user.id },
          select: { total_visible_seconds: true },
        });
        const totalSeconds =
          sessions?.reduce(
            (acc, s) => acc + (s.total_visible_seconds || 0),
            0,
          ) || 0;
        return totalSeconds >= 86400;
      },
    },
    coins_collector: {
      key: 'coins_collector',
      name: 'Coin Collector',
      description: 'Accumulate 1000 coins',
      reward: 100,
      check: async (user: any, context: any) => user.coins >= 1000,
    },
    coins_hoarder: {
      key: 'coins_hoarder',
      name: 'Coin Hoarder',
      description: 'Accumulate 5000 coins',
      reward: 300,
      check: async (user: any, context: any) => user.coins >= 5000,
    },
    weekly_login: {
      key: 'weekly_login',
      name: 'Dedicated User',
      description: 'Login 7 days in a row',
      reward: 150,
      check: async (user: any, context: any) => {
        const logins = await context.dailyLoginRepo.find({
          where: { user_id: user.id },
          order: { login_date: 'DESC' },
          take: 7,
        });

        if (!logins || logins.length < 7) return false;

        const dates = logins.map((l) => new Date(l.login_date).getTime());
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;

        for (let i = 0; i < 7; i++) {
          const expectedDate = now - i * dayMs;
          const actualDate = dates[i];
          const diff = Math.abs(expectedDate - actualDate);
          if (diff > dayMs) return false;
        }

        return true;
      },
    },
  };

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    @InjectRepository(AfkSession)
    private afkSessionRepo: Repository<AfkSession>,
    @InjectRepository(UserAchievement)
    private userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(DailyLogin)
    private dailyLoginRepo: Repository<DailyLogin>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
  ) {}

  async checkAndAwardAchievements(
    userId: string,
  ): Promise<{ newlyUnlocked: any[]; totalUnlocked: number }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.warn(`User ${userId} not found for achievement check`);
      return { newlyUnlocked: [], totalUnlocked: 0 };
    }

    const existingAchievements = await this.userAchievementRepo.find({
      where: { user_id: userId },
      select: { achievement_key: true },
    });

    const unlockedKeys = new Set(
      existingAchievements?.map((a) => a.achievement_key) || [],
    );
    const newlyUnlocked: any[] = [];

    for (const [key, achievement] of Object.entries(this.ACHIEVEMENTS)) {
      if (unlockedKeys.has(key)) continue;

      try {
        const context = {
          serverRepo: this.serverRepo,
          afkSessionRepo: this.afkSessionRepo,
          dailyLoginRepo: this.dailyLoginRepo,
        };
        const isUnlocked = await achievement.check(user, context);

        if (isUnlocked) {
          await this.awardAchievement(userId, key, achievement.reward);
          newlyUnlocked.push({
            key,
            name: achievement.name,
            description: achievement.description,
            reward: achievement.reward,
          });
          unlockedKeys.add(key);
        }
      } catch (error) {
        this.logger.error(`Error checking achievement ${key}:`, error);
      }
    }

    return {
      newlyUnlocked,
      totalUnlocked: unlockedKeys.size,
    };
  }

  private async awardAchievement(
    userId: string,
    achievementKey: string,
    reward: number,
  ): Promise<void> {
    await this.userAchievementRepo.save(
      this.userAchievementRepo.create({
        user_id: userId,
        achievement_key: achievementKey,
        coins_rewarded: reward,
        achieved_at: new Date().toISOString(),
      }),
    );

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { coins: true },
    });

    if (user) {
      const newCoins = user.coins + reward;
      const updateResult = await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({ coins: newCoins })
        .where('id = :id AND coins = :coins', { id: userId, coins: user.coins })
        .execute();

      if (updateResult.affected) {
        await this.transactionRepo.save(
          this.transactionRepo.create({
            user_id: userId,
            type: 'achievement',
            amount: reward,
            description: `Achievement unlocked: ${achievementKey}`,
          }),
        );

        this.logger.log(
          `Achievement ${achievementKey} unlocked for user ${userId}, rewarded ${reward} coins`,
        );
      }
    }
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    const userAchievements = await this.userAchievementRepo.find({
      where: { user_id: userId },
      order: { achieved_at: 'DESC' },
    });

    if (!userAchievements) return [];

    return userAchievements.map((ua) => {
      const achievement =
        this.ACHIEVEMENTS[ua.achievement_key as keyof typeof this.ACHIEVEMENTS];
      return {
        key: ua.achievement_key,
        name: achievement?.name || ua.achievement_key,
        description: achievement?.description || '',
        reward: ua.coins_rewarded,
        achievedAt: ua.achieved_at,
      };
    });
  }

  async getAvailableAchievements(): Promise<any[]> {
    return Object.entries(this.ACHIEVEMENTS).map(([key, achievement]) => ({
      key,
      name: achievement.name,
      description: achievement.description,
      reward: achievement.reward,
    }));
  }

  async getAchievementProgress(userId: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) return {};

    const existingAchievements = await this.userAchievementRepo.find({
      where: { user_id: userId },
      select: { achievement_key: true },
    });

    const unlockedKeys = new Set(
      existingAchievements?.map((a) => a.achievement_key) || [],
    );
    const progress: any = {};

    const serverCount = await this.serverRepo.count({
      where: { user_id: userId },
    });

    const afkSessions = await this.afkSessionRepo.find({
      where: { user_id: userId },
      select: { total_visible_seconds: true },
    });
    const totalAfkSeconds =
      afkSessions?.reduce(
        (acc, s) => acc + (s.total_visible_seconds || 0),
        0,
      ) || 0;

    const dailyLogins = await this.dailyLoginRepo.find({
      where: { user_id: userId },
      order: { login_date: 'DESC' },
      take: 7,
    });

    progress.first_login = {
      unlocked: unlockedKeys.has('first_login'),
      current: 1,
      target: 1,
    };

    progress.discord_linked = {
      unlocked: unlockedKeys.has('discord_linked'),
      current: user.discord_id ? 1 : 0,
      target: 1,
    };

    progress.first_server = {
      unlocked: unlockedKeys.has('first_server'),
      current: serverCount || 0,
      target: 1,
    };

    progress.five_servers = {
      unlocked: unlockedKeys.has('five_servers'),
      current: serverCount || 0,
      target: 5,
    };

    progress.ten_servers = {
      unlocked: unlockedKeys.has('ten_servers'),
      current: serverCount || 0,
      target: 10,
    };

    progress.afk_hour = {
      unlocked: unlockedKeys.has('afk_hour'),
      current: Math.floor(totalAfkSeconds / 60),
      target: 60,
    };

    progress.afk_day = {
      unlocked: unlockedKeys.has('afk_day'),
      current: Math.floor(totalAfkSeconds / 3600),
      target: 24,
    };

    progress.coins_collector = {
      unlocked: unlockedKeys.has('coins_collector'),
      current: user.coins,
      target: 1000,
    };

    progress.coins_hoarder = {
      unlocked: unlockedKeys.has('coins_hoarder'),
      current: user.coins,
      target: 5000,
    };

    progress.weekly_login = {
      unlocked: unlockedKeys.has('weekly_login'),
      current: dailyLogins?.length || 0,
      target: 7,
    };

    return progress;
  }
}

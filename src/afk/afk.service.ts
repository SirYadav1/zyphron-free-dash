import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, MoreThanOrEqual } from 'typeorm';
import { AfkSession } from '../entities/afk-session.entity';
import { User } from '../entities/user.entity';
import { Setting } from '../entities/setting.entity';
import { Transaction } from '../entities/transaction.entity';
import * as crypto from 'crypto';

const HEARTBEAT_TIMEOUT_SECONDS = 60;
const HEARTBEAT_INTERVAL_SECONDS = 10;

@Injectable()
export class AfkService {
  private readonly logger = new Logger(AfkService.name);

  constructor(
    @InjectRepository(AfkSession)
    private afkSessionRepo: Repository<AfkSession>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
  ) {}

  private cachedRates = { coins: 10, interval: 1 };
  private lastSettingsFetch: number = 0;

  private async getAfkRates(): Promise<{ coins: number; interval: number }> {
    const now = Date.now();
    if (now - this.lastSettingsFetch > 60000) {
      const settings = await this.settingRepo.find({
        where: {
          key: In(['afk_coins_per_minute', 'afk_time_interval_minutes']),
        },
      });

      let coins = 10;
      let interval = 1;

      if (settings) {
        for (const s of settings) {
          if (s.key === 'afk_coins_per_minute') coins = parseInt(s.value) || 10;
          if (s.key === 'afk_time_interval_minutes')
            interval = parseInt(s.value) || 1;
        }
      }

      this.cachedRates = { coins, interval: Math.max(1, interval) };
      this.lastSettingsFetch = now;
    }
    return this.cachedRates;
  }

  async startSession(
    userId: string,
  ): Promise<{ sessionId: number; tabId: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (user.is_banned)
      throw new HttpException('Account is banned', HttpStatus.FORBIDDEN);

    const existingSession = await this.afkSessionRepo.findOne({
      where: { user_id: userId, is_active: 1 },
    });

    if (existingSession) {
      const now = new Date();
      const timeSinceLastHeartbeat = existingSession.last_heartbeat_at
        ? (now.getTime() -
            new Date(existingSession.last_heartbeat_at).getTime()) /
          1000
        : 0;

      if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT_SECONDS) {
        this.logger.log(
          `Reclaiming stale session ${existingSession.id} for user ${userId}`,
        );
        await this.afkSessionRepo.update(existingSession.id, {
          is_active: 0,
          ended_at: now.toISOString(),
        });
      } else {
        throw new HttpException(
          'You already have an active AFK session in another tab. Close it first.',
          HttpStatus.CONFLICT,
        );
      }
    }

    const tabId = crypto.randomUUID();

    const session = this.afkSessionRepo.create({
      user_id: userId,
      tab_id: tabId,
      is_active: 1,
      started_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      total_earned: 0,
      total_visible_seconds: 0,
    });

    const saved = await this.afkSessionRepo.save(session);

    this.logger.log(
      `Session started: id=${saved.id}, user=${userId}, tabId=${tabId}`,
    );
    return { sessionId: saved.id, tabId };
  }

  async heartbeat(
    sessionId: number,
    tabId: string,
    visible: boolean,
    userId: string,
  ): Promise<{
    earned: number;
    totalEarned: number;
    totalSeconds: number;
    isActive: boolean;
  }> {
    const session = await this.afkSessionRepo.findOne({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      this.logger.warn(`Heartbeat failed: session ${sessionId} not found`);
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }

    if (session.tab_id !== tabId) {
      throw new HttpException('Invalid tab', HttpStatus.FORBIDDEN);
    }

    if (!session.is_active) {
      return {
        earned: 0,
        totalEarned: session.total_earned,
        totalSeconds: session.total_visible_seconds,
        isActive: false,
      };
    }

    const now = new Date();
    const timeSinceLastHeartbeat = session.last_heartbeat_at
      ? (now.getTime() - new Date(session.last_heartbeat_at).getTime()) / 1000
      : 0;

    if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT_SECONDS) {
      this.logger.log(`Session ${sessionId} timed out`);
      await this.afkSessionRepo.update(sessionId, {
        is_active: 0,
        ended_at: now.toISOString(),
      });
      return {
        earned: 0,
        totalEarned: session.total_earned,
        totalSeconds: session.total_visible_seconds,
        isActive: false,
      };
    }

    const rates = await this.getAfkRates();
    let earnedThisHeartbeat = 0;

    let totalVisibleSeconds = session.total_visible_seconds;
    let totalEarned = session.total_earned;

    if (visible) {
      const oldIntervals = Math.floor(
        totalVisibleSeconds / (60 * rates.interval),
      );
      totalVisibleSeconds += HEARTBEAT_INTERVAL_SECONDS;
      const newIntervals = Math.floor(
        totalVisibleSeconds / (60 * rates.interval),
      );

      if (newIntervals > oldIntervals) {
        const expectedTotal = newIntervals * rates.coins;
        earnedThisHeartbeat = expectedTotal - totalEarned;
        if (earnedThisHeartbeat > 0) {
          totalEarned += earnedThisHeartbeat;
        }
      }
    }

    await this.afkSessionRepo.update(sessionId, {
      total_visible_seconds: totalVisibleSeconds,
      total_earned: totalEarned,
      last_heartbeat_at: now.toISOString(),
    });

    if (earnedThisHeartbeat > 0) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: { coins: true },
      });
      if (user) {
        const updateResult = await this.userRepo
          .createQueryBuilder()
          .update(User)
          .set({ coins: user.coins + earnedThisHeartbeat })
          .where('id = :id AND coins = :coins', {
            id: userId,
            coins: user.coins,
          })
          .execute();

        if (updateResult.affected) {
          await this.transactionRepo.save(
            this.transactionRepo.create({
              user_id: userId,
              type: 'earn',
              amount: earnedThisHeartbeat,
              description: `AFK earning - Session #${sessionId}`,
            }),
          );
          this.logger.log(`User ${userId} earned ${earnedThisHeartbeat} coins`);
        }
      }
    }

    return {
      earned: earnedThisHeartbeat,
      totalEarned: totalEarned,
      totalSeconds: totalVisibleSeconds,
      isActive: true,
    };
  }

  async endSession(
    sessionId: number,
    tabId: string,
    userId: string,
  ): Promise<void> {
    const session = await this.afkSessionRepo.findOne({
      where: { id: sessionId, user_id: userId },
    });
    if (!session || !session.is_active) return;
    if (session.tab_id !== tabId)
      throw new HttpException('Invalid tab', HttpStatus.FORBIDDEN);

    await this.afkSessionRepo.update(sessionId, {
      is_active: 0,
      ended_at: new Date().toISOString(),
    });
  }

  async getStats(userId: string): Promise<{
    todayEarned: number;
    totalCoins: number;
    activeSession: boolean;
    sessionMinutes: number;
    rateCoins: number;
    rateInterval: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await this.transactionRepo.find({
      where: {
        user_id: userId,
        type: 'earn',
        created_at: MoreThanOrEqual(today.toISOString()),
      },
      select: { amount: true },
    });

    const todayEarned = transactions
      ? transactions.reduce((acc, curr) => acc + curr.amount, 0)
      : 0;

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { coins: true },
    });
    const activeSession = await this.afkSessionRepo.findOne({
      where: { user_id: userId, is_active: 1 },
    });

    // Sum lifetime visible seconds across ALL sessions (active + completed)
    const allSessions = await this.afkSessionRepo.find({
      where: { user_id: userId },
      select: { total_visible_seconds: true },
    });
    const lifetimeVisibleSeconds = allSessions.reduce(
      (sum, s) => sum + (s.total_visible_seconds || 0),
      0,
    );
    const sessionMinutes = Math.floor(lifetimeVisibleSeconds / 60);

    const rates = await this.getAfkRates();

    return {
      todayEarned,
      totalCoins: user?.coins || 0,
      activeSession: !!activeSession,
      sessionMinutes,
      rateCoins: rates.coins,
      rateInterval: rates.interval,
    };
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async cleanupStaleSessions() {
    const timeout = new Date(Date.now() - HEARTBEAT_TIMEOUT_SECONDS * 1000);
    const staleSessions = await this.afkSessionRepo.find({
      where: {
        is_active: 1,
        last_heartbeat_at: LessThan(timeout.toISOString()),
      },
    });

    for (const session of staleSessions) {
      this.logger.log(`Cleaning up stale AFK session ${session.id}`);
      await this.afkSessionRepo.update(session.id, {
        is_active: 0,
        ended_at: new Date().toISOString(),
      });
    }
  }
}

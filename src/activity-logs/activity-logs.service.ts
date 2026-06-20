import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly logRepo: Repository<ActivityLog>,
  ) {}

  async create(data: {
    log_name?: string;
    description: string;
    subject_type?: string;
    subject_id?: number;
    event?: string;
    causer_type?: string;
    causer_id?: string;
    properties?: any;
    batch_uuid?: string;
  }): Promise<ActivityLog> {
    const log = this.logRepo.create({
      ...data,
      properties: data.properties ? JSON.stringify(data.properties) : null,
    });
    return this.logRepo.save(log);
  }

  async findAll(page: number = 1, limit: number = 50): Promise<ActivityLog[]> {
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;

    return this.logRepo.find({
      order: { created_at: 'DESC' },
      take: safeLimit,
      skip,
    });
  }

  async count(): Promise<number> {
    return this.logRepo.count();
  }
}

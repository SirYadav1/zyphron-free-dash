import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('afk_sessions')
export class AfkSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  user_id: string;

  @Column({ type: 'text' })
  tab_id: string;

  @Column({ type: 'integer', default: 0 })
  total_earned: number;

  @Column({ type: 'integer', default: 0 })
  total_visible_seconds: number;

  @Column({ type: 'integer', default: 1 })
  is_active: number;

  @Column({ type: 'text' })
  started_at: string;

  @Column({ type: 'text', nullable: true })
  last_heartbeat_at: string | null;

  @Column({ type: 'text', nullable: true })
  ended_at: string | null;
}

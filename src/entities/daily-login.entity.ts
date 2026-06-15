import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

@Entity('daily_logins')
@Unique(['user_id', 'login_date'])
export class DailyLogin {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  user_id: string;

  @Column({ type: 'text' })
  login_date: string;

  @Column({ type: 'integer', default: 0 })
  coins_earned: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;
}

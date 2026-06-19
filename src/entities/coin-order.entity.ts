import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('coin_orders')
export class CoinOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  user_id: string;

  @Column({ type: 'text' })
  package_name: string;

  @Column({ type: 'integer' })
  coins_amount: number;

  @Column({ type: 'integer' })
  price: number;

  @Column({ type: 'text', default: 'USD' })
  currency_code: string;

  @Column({ type: 'text', default: 'pending' })
  status: string; // pending, awaiting_screenshot, paid, approved, declined

  @Column({ type: 'text', nullable: true })
  screenshot_path: string | null;

  @Column({ type: 'text', nullable: true })
  admin_message: string | null;

  @Column({ type: 'text', nullable: true })
  payment_address: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

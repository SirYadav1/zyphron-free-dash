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
import { Payment } from './payment.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'text', nullable: true })
  user_id: string | null;

  @ManyToOne(() => Payment, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment | null;

  @Column({ type: 'integer', nullable: true })
  payment_id: number | null;

  @Column({ type: 'text', unique: true })
  invoice_number: string;

  @Column({ type: 'integer', default: 0 })
  amount: number;

  @Column({ type: 'integer', default: 0 })
  tax_amount: number;

  @Column({ type: 'integer', default: 0 })
  total_amount: number;

  @Column({ type: 'text', default: 'INR' })
  currency: string;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  due_date: string | null;

  @Column({ type: 'text', nullable: true })
  paid_at: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

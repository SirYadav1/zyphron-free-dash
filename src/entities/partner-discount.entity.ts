import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('partner_discounts')
export class PartnerDiscount {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  user_id: string;

  @Column({ type: 'integer', default: 0 })
  partner_discount: number;

  @Column({ type: 'integer', default: 0 })
  registered_user_discount: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;
}

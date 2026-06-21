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
import { ShopProduct } from './shop-product.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  user_id: string;

  @ManyToOne(() => ShopProduct, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'shop_product_id' })
  shop_product: ShopProduct | null;

  @Column({ type: 'integer', nullable: true })
  shop_product_id: number | null;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'text', default: 'INR' })
  currency_code: string;

  @Column({ type: 'text' })
  method: string;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  tax: number;

  @Column({ type: 'text', nullable: true })
  transaction_id: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

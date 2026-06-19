import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  code: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'integer' })
  value: number;

  @Column({ type: 'integer', nullable: true })
  max_uses: number | null;

  @Column({ type: 'integer', default: 0 })
  min_product_price: number;

  @Column({ type: 'text', nullable: true })
  expires_at: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;
}

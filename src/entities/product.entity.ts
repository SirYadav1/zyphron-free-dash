import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer' })
  price: number;

  @Column({ type: 'text', default: 'monthly' })
  billing_priority: string;

  @Column({ type: 'integer', default: 1 })
  cpu: number;

  @Column({ type: 'integer', default: 1024 })
  ram: number;

  @Column({ type: 'integer', default: 1024 })
  swap: number;

  @Column({ type: 'integer', default: 10240 })
  disk: number;

  @Column({ type: 'integer', default: 1 })
  databases: number;

  @Column({ type: 'integer', default: 1 })
  backups: number;

  @Column({ type: 'integer', default: 1 })
  oom_killer: number;

  @Column({ type: 'integer', default: 0 })
  allocations: number;

  @Column({ type: 'integer', default: 1 })
  server_limit: number;

  @Column({ type: 'integer', default: 0 })
  disabled: number;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @Column({ type: 'integer', nullable: true })
  nest_id: number | null;

  @Column({ type: 'integer', nullable: true })
  egg_id: number | null;

  @Column({ type: 'integer', nullable: true })
  category_id: number | null;

  @Column({ type: 'integer', default: 7 })
  duration_days: number;

  @Column({ type: 'text', nullable: true })
  egg_name: string | null;

  @Column({ type: 'text', nullable: true })
  nest_name: string | null;

  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @Column({ type: 'integer', default: 1000 })
  coin_price: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

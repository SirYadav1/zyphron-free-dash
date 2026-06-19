import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('service_categories')
export class ServiceCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  image_url: string | null;

  @Column({ type: 'text', nullable: true })
  sub_image_url: string | null; // corner badge image

  @Column({ type: 'integer', default: 0 })
  display_order: number;

  @Column({ type: 'integer', default: 1 })
  is_active: number; // 1=active, 0=inactive

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

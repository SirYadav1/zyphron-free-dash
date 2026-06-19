import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  log_name: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  subject_type: string | null;

  @Column({ type: 'integer', nullable: true })
  subject_id: number | null;

  @Column({ type: 'text', nullable: true })
  event: string | null;

  @Column({ type: 'text', nullable: true })
  causer_type: string | null;

  @Column({ type: 'text', nullable: true })
  causer_id: string | null;

  @Column({ type: 'text', nullable: true })
  properties: string | null;

  @Column({ type: 'text', nullable: true })
  batch_uuid: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

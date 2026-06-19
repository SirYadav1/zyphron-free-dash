import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('server_templates')
export class ServerTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'integer' })
  node_id: number;

  @Column({ type: 'integer' })
  egg_id: number;

  @Column({ type: 'integer' })
  nest_id: number;

  @Column({ type: 'integer' })
  ram_mb: number;

  @Column({ type: 'integer' })
  cpu_percent: number;

  @Column({ type: 'integer' })
  disk_mb: number;

  @Column({ type: 'integer', default: 0 })
  databases_limit: number;

  @Column({ type: 'integer', default: 1 })
  allocations_limit: number;

  @Column({ type: 'integer', default: 0 })
  backup_limit: number;

  @Column({ type: 'integer', default: 0 })
  dedicated_ip: number;

  @Column({ type: 'text', nullable: true })
  docker_image: string | null;

  @Column({ type: 'integer', default: 1 })
  is_active: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

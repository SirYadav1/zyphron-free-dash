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
import { ServerTemplate } from './server-template.entity';

@Entity('servers')
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  user_id: string;

  @ManyToOne(() => ServerTemplate, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: ServerTemplate | null;

  @Column({ type: 'integer', nullable: true })
  template_id: number | null;

  @Column({ type: 'text', nullable: true })
  pterodactyl_server_id: string | null;

  @Column({ type: 'text' })
  server_name: string;

  @Column({ type: 'integer' })
  ram_mb: number;

  @Column({ type: 'integer' })
  cpu_percent: number;

  @Column({ type: 'integer' })
  disk_mb: number;

  @Column({ type: 'text', default: 'active' })
  status: string;

  @Column({ type: 'text', nullable: true })
  expires_at: string | null;

  @Column({ type: 'integer', default: 50 })
  renewal_price: number;

  @Column({ type: 'integer', default: 0 })
  is_suspended: number;
  @Column({ type: 'integer', default: 0 })
  auto_renew: number;


  @Column({ type: 'text', nullable: true })
  suspended_at: string | null;

  @Column({ type: 'text', nullable: true })
  last_active_at: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

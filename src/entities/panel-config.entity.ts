import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('panel_config')
export class PanelConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', default: 'pterodactyl' })
  panel_type: string;

  @Column({ type: 'text' })
  panel_url: string;

  @Column({ type: 'text' })
  api_key: string;

  @Column({ type: 'integer', default: 1 })
  is_active: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

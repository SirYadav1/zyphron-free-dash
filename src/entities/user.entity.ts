import { Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @Column({ type: 'text', primary: true })
  id: string;

  @Column({ type: 'text', unique: true })
  username: string;

  @Column({ type: 'text', nullable: true })
  first_name: string | null;

  @Column({ type: 'text', nullable: true })
  last_name: string | null;

  @Column({ type: 'text', unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  password_hash: string | null;

  @Column({ type: 'integer', default: 100 })
  coins: number;

  @Column({ type: 'text', nullable: true })
  discord_id: string | null;

  @Column({ type: 'text', nullable: true })
  discord_username: string | null;

  @Column({ type: 'text', nullable: true })
  discord_left_at: string | null;

  @Column({ type: 'integer', nullable: true })
  pterodactyl_user_id: number | null;

  @Column({ type: 'text', nullable: true })
  pterodactyl_username: string | null;

  @Column({ type: 'integer', default: 0 })
  is_banned: number;

  @Column({ type: 'text', nullable: true })
  banned_at: string | null;

  @Column({ type: 'text', nullable: true })
  ban_reason: string | null;

  @Column({ type: 'text', nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  device_fingerprint: string | null;

  @Column({ type: 'text', nullable: true })
  two_factor_secret: string | null;

  @Column({ type: 'integer', default: 0 })
  two_factor_enabled: number;

  @Column({ type: 'integer', default: 0 })
  is_admin: number;

  @Column({ type: 'integer', default: 0 })
  email_verified: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  last_active: string;
  updated_at: string;
}

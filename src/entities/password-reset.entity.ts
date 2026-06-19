import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text' })
  otp: string;

  @Column({ type: 'text', nullable: true })
  reset_token: string;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'text' })
  expires_at: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 0 })
  resend_count: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;
}

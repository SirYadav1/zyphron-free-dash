import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({ type: 'text', default: 'web' })
  guard_name: string;

  @Column({ type: 'integer', default: 0 })
  ticket_accept: number;

  @Column({ type: 'integer', default: 0 })
  ticket_reject: number;

  @Column({ type: 'integer', default: 0 })
  ticket_chat: number;

  @Column({ type: 'integer', default: 0 })
  coin_approve: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

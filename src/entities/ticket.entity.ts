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

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  ticket_id: string;

  @Column({ type: 'text', unique: true, nullable: true })
  ticket_number: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  user_id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'integer', nullable: true })
  ticketcategory_id: number | null;

  @Column({ type: 'text', default: 'Medium' })
  priority: string;

  @Column({ type: 'text', default: 'Open' })
  status: string;

  @Column({ type: 'text', nullable: true })
  server: string | null;

  @Column({ type: 'text', nullable: true })
  closed_html: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;
}

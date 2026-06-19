import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('ticket_blacklist')
export class TicketBlacklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  value: string;

  @CreateDateColumn({ type: 'text' })
  created_at: string;
}

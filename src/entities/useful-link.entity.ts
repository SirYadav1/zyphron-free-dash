import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('useful_links')
export class UsefulLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  icon: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  link: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true, default: 'sidebar' })
  position: string;

  @CreateDateColumn({ type: 'text' })
  created_at: string;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  code: string;

  @Column({ type: 'integer' })
  credits: number;

  @Column({ type: 'integer', default: 1 })
  uses: number;

  @Column({ type: 'text', nullable: true })
  expires_at: string | null;

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @CreateDateColumn({ type: 'text' })
  created_at: string;
}

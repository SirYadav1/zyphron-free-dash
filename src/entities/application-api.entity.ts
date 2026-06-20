import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('application_apis')
export class ApplicationApi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  memo: string | null;

  @Column({ type: 'text', unique: true })
  token: string;

  @Column({ type: 'integer', default: 1 })
  is_active: number;

  // permissions - JSON array of allowed resources
  // example: ["users:read", "servers:read", "tickets:read", "tickets:write"]
  @Column({ type: 'text', default: '[]' })
  permissions: string;

  // IP whitelist - comma separated IPs, empty = allow all
  @Column({ type: 'text', default: '' })
  ip_whitelist: string;

  // rate limit override (requests per minute)
  @Column({ type: 'integer', default: 60 })
  rate_limit: number;

  @CreateDateColumn({ type: 'text' })
  created_at: string;

  @UpdateDateColumn({ type: 'text' })
  updated_at: string;

  // helper methods
  getPermissionsList(): string[] {
    try {
      return JSON.parse(this.permissions);
    } catch {
      return [];
    }
  }

  hasPermission(resource: string, action: string): boolean {
    const perms = this.getPermissionsList();
    return perms.includes(`${resource}:${action}`) || perms.includes(`${resource}:*`);
  }

  isIpAllowed(ip: string): boolean {
    if (!this.ip_whitelist) return true;
    const allowedIps = this.ip_whitelist.split(',').map(ip => ip.trim());
    return allowedIps.includes(ip);
  }
}

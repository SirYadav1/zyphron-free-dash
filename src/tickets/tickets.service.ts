import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Ticket } from '../entities/ticket.entity';
import { TicketComment } from '../entities/ticket-comment.entity';
import { TicketCategory } from '../entities/ticket-category.entity';
import { TicketBlacklist } from '../entities/ticket-blacklist.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(TicketComment)
    private readonly commentRepo: Repository<TicketComment>,
    @InjectRepository(TicketCategory)
    private readonly categoryRepo: Repository<TicketCategory>,
    @InjectRepository(TicketBlacklist)
    private readonly blacklistRepo: Repository<TicketBlacklist>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createTicket(
    userId: string,
    dto: {
      title: string;
      priority?: string;
      categoryId?: number;
      message: string;
      server?: string;
    },
  ): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const blacklistEntries = await this.blacklistRepo.find();
    for (const entry of blacklistEntries) {
      if (entry.type === 'email' && user.email === entry.value) {
        throw new ForbiddenException('You are blacklisted from creating tickets');
      }
      if (entry.type === 'username' && user.username === entry.value) {
        throw new ForbiddenException('You are blacklisted from creating tickets');
      }
      if (entry.type === 'ip' && user.ip_address === entry.value) {
        throw new ForbiddenException('You are blacklisted from creating tickets');
      }
    }

    const ticketId = randomBytes(4).toString('hex');

    // generate sequential ticket number: ZYPHC-XXXX
    const lastTicket = await this.ticketRepo.findOne({
      order: { id: 'DESC' },
      select: { ticket_number: true },
    });
    let nextNum = 1;
    if (lastTicket?.ticket_number) {
      const match = lastTicket.ticket_number.match(/ZYPHC-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const ticketNumber = `ZYPHC-${String(nextNum).padStart(4, '0')}`;

    const ticket = this.ticketRepo.create({
      ticket_id: ticketId,
      ticket_number: ticketNumber,
      user_id: userId,
      title: dto.title,
      priority: dto.priority || 'Medium',
      ticketcategory_id: dto.categoryId || null,
      server: dto.server || null,
    });
    const saved = await this.ticketRepo.save(ticket);
    await this.commentRepo.save(
      this.commentRepo.create({
        ticket_id: saved.id,
        user_id: userId,
        comment: dto.message,
      }),
    );
    return this.getTicket(saved.id);
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    return this.ticketRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      relations: { user: true },
    });
  }

  async getTicket(id: number, userId?: string): Promise<any> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (userId && ticket.user_id !== userId)
      throw new NotFoundException('Ticket not found');
    const comments = await this.commentRepo.find({
      where: { ticket_id: id },
      order: { created_at: 'ASC' },
      relations: { user: true },
    });
    return { ...ticket, comments };
  }

  async addComment(
    userId: string,
    ticketId: number,
    comment: string,
    isAdmin: boolean,
  ): Promise<any> {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdmin && ticket.user_id !== userId)
      throw new ForbiddenException('You do not have access to this ticket');
    const saved = await this.commentRepo.save(
      this.commentRepo.create({
        ticket_id: ticketId,
        user_id: userId,
        comment,
      }),
    );
    return saved;
  }

  async getAllTickets(): Promise<Ticket[]> {
    return this.ticketRepo.find({
      order: { created_at: 'DESC' },
      relations: { user: true },
    });
  }

  async searchTickets(email?: string, userId?: string): Promise<Ticket[]> {
    if (email) {
      const user = await this.userRepo.findOne({ where: { email } });
      if (!user) return [];
      return this.ticketRepo.find({
        where: { user_id: user.id },
        order: { created_at: 'DESC' },
        relations: { user: true },
      });
    }
    if (userId) {
      return this.ticketRepo.find({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
        relations: { user: true },
      });
    }
    return this.getAllTickets();
  }

  async getCategories(): Promise<TicketCategory[]> {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async createCategory(name: string): Promise<TicketCategory> {
    return this.categoryRepo.save(this.categoryRepo.create({ name }));
  }

  async getBlacklist(): Promise<TicketBlacklist[]> {
    return this.blacklistRepo.find();
  }

  async addBlacklistEntry(
    type: string,
    value: string,
  ): Promise<TicketBlacklist> {
    // only the known blacklist types
    const validTypes = ['email', 'username', 'ip'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Invalid blacklist type. Must be one of: ${validTypes.join(', ')}`,
      );
    }
    return this.blacklistRepo.save(this.blacklistRepo.create({ type, value }));
  }

  async removeBlacklistEntry(id: number): Promise<void> {
    const result = await this.blacklistRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Blacklist entry not found');
  }

  async closeTicket(id: number, userId?: string): Promise<any> {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (userId && ticket.user_id !== userId)
      throw new NotFoundException('Ticket not found');

    // generate HTML snapshot of the conversation
    const comments = await this.commentRepo.find({
      where: { ticket_id: id },
      order: { created_at: 'ASC' },
      relations: { user: true },
    });

    const commentRows = comments.map((c) => {
      const author = c.user
        ? `${c.user.username || 'User'} (${c.user.email || 'N/A'})`
        : `User ${c.user_id}`;
      const role = c.is_admin ? 'Admin' : 'User';
      const ts = c.created_at;
      return `
        <div style="margin-bottom:12px;padding:12px;border-radius:8px;background:${c.is_admin ? '#1e293b' : '#0f172a'};border:1px solid #334155;">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <strong style="color:#e2e8f0;">${role}: ${this.escapeHtml(author)}</strong>
            <span style="color:#64748b;font-size:12px;">${this.escapeHtml(ts)}</span>
          </div>
          <div style="color:#cbd5e1;white-space:pre-wrap;">${this.escapeHtml(c.comment)}</div>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Ticket ${this.escapeHtml(ticket.ticket_number || String(ticket.ticket_id))}</title></head>
<body style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;max-width:800px;margin:0 auto;padding:20px;">
  <h1 style="color:#2563eb;">${this.escapeHtml(ticket.title)}</h1>
  <p><strong>Ticket #:</strong> ${this.escapeHtml(ticket.ticket_number || String(ticket.ticket_id))}</p>
  <p><strong>Priority:</strong> ${ticket.priority}</p>
  <p><strong>Status:</strong> Closed</p>
  <p><strong>Created:</strong> ${ticket.created_at}</p>
  <p><strong>Server:</strong> ${ticket.server || 'N/A'}</p>
  <hr style="border-color:#334155;" />
  <h2 style="color:#94a3b8;">Conversation</h2>
  ${commentRows || '<p>No comments.</p>'}
</body>
</html>`;

    await this.ticketRepo.update(id, {
      status: 'closed',
      closed_html: html,
    });
    return { message: 'Ticket closed', ticketId: id };
  }

  // escape user-derived values before interpolating them into the stored
  // HTML snapshot — prevents stored XSS when the snapshot is viewed (bug fix)
  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

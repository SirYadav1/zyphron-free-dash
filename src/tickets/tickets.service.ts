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
    const ticket = this.ticketRepo.create({
      ticket_id: ticketId,
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
    // BUG-M3 FIX: Validate blacklist type
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
    await this.ticketRepo.update(id, { status: 'closed' });
    return { message: 'Ticket closed', ticketId: id };
  }
}

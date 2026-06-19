import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../entities/email-template.entity';

@Injectable()
export class EmailTemplatesService {
  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepo: Repository<EmailTemplate>,
  ) {}

  async findAll(): Promise<EmailTemplate[]> {
    return this.templateRepo.find({ order: { type: 'ASC', name: 'ASC' } });
  }

  async findOne(id: number): Promise<EmailTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Email template not found');
    return template;
  }

  async findByName(name: string): Promise<EmailTemplate | null> {
    return this.templateRepo.findOne({ where: { name } });
  }

  async create(dto: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const existing = await this.templateRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Template with name "${dto.name}" already exists`);
    }
    return this.templateRepo.save(this.templateRepo.create(dto));
  }

  async update(id: number, dto: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const existing = await this.findOne(id);
    if (dto.name && dto.name !== existing.name) {
      const nameTaken = await this.templateRepo.findOne({ where: { name: dto.name } });
      if (nameTaken) {
        throw new ConflictException(`Template with name "${dto.name}" already exists`);
      }
    }
    await this.templateRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.templateRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Email template not found');
    }
  }

  /**
   * Render a template by name, replacing {{variable}} placeholders with provided values.
   */
  async render(name: string, vars: Record<string, string> = {}): Promise<{ subject: string; body: string }> {
    const template = await this.templateRepo.findOne({ where: { name } });
    if (!template) {
      throw new NotFoundException(`Email template "${name}" not found`);
    }
    if (!template.is_active) {
      throw new NotFoundException(`Email template "${name}" is not active`);
    }

    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(vars)) {
      const placeholder = `{{${key}}}`;
      // BUG-M8 FIX: Escape HTML in template variables to prevent injection
      const escapedValue = (value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      subject = subject.split(placeholder).join(escapedValue);
      body = body.split(placeholder).join(escapedValue);
    }

    return { subject, body };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailSuppression } from '../entities/email-suppression.entity';

@Injectable()
export class EmailSuppressionService {
  constructor(
    @InjectRepository(EmailSuppression)
    private suppressionRepository: Repository<EmailSuppression>,
  ) {}

  async isSuppressed(email: string): Promise<boolean> {
    const count = await this.suppressionRepository.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  async suppress(email: string, reason: string): Promise<void> {
    const normalized = email.toLowerCase();
    const existing = await this.suppressionRepository.findOne({
      where: { email: normalized },
    });
    if (!existing) {
      await this.suppressionRepository.save(
        this.suppressionRepository.create({ email: normalized, reason }),
      );
    }
  }

  async remove(email: string): Promise<void> {
    await this.suppressionRepository.delete({ email: email.toLowerCase() });
  }
}

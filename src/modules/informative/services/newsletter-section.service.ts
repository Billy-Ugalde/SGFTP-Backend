import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSection } from '../entities/newsletter-section.entity';
import { UpdateNewsletterDto } from '../dto/update-newsletter.dto';

@Injectable()
export class NewsletterSectionService {
  constructor(
    @InjectRepository(NewsletterSection)
    private readonly repo: Repository<NewsletterSection>,
  ) {}

  async get(): Promise<NewsletterSection> {
    return this.repo.findOneByOrFail({ id: 'newsletter_section' });
  }

  async update(dto: UpdateNewsletterDto): Promise<NewsletterSection> {
    await this.repo.update('newsletter_section', dto);
    return this.get();
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewslettersController } from './newsletters.controller';
import { NewsletterService } from './services/newsletter.service';
import { NewsletterTemplateService } from './services/newsletter-template.service';
import { NewsletterCampaign } from './entities/newsletter-campaign.entity';
import { Subscriber } from '../subscribers/entities/subscriber.entity';
import { User } from '../users/entities/user.entity';
import { Person } from '../../entities/person.entity';
import { ContactInfo } from '../informative/entities/contact-info.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NewsletterCampaign,
      Subscriber,
      User,
      Person,
      ContactInfo,
    ]),
    AuthModule
  ],
  controllers: [NewslettersController],
  providers: [NewsletterService, NewsletterTemplateService],
  exports: [NewsletterService, NewsletterTemplateService],
})
export class NewslettersModule {}

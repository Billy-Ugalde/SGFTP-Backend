import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog } from './entities/email-log.entity';
import { EmailSuppression } from './entities/email-suppression.entity';
import { EmailProviderService } from './services/email-provider.service';
import { EmailLogService } from './services/email-log.service';
import { EmailSuppressionService } from './services/email-suppression.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailTemplateService } from './services/email-template.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailLog, EmailSuppression])],
  providers: [
    EmailProviderService,
    EmailLogService,
    EmailSuppressionService,
    EmailQueueService,
    EmailTemplateService,
  ],
  exports: [EmailQueueService, EmailTemplateService],
})
export class EmailModule {}

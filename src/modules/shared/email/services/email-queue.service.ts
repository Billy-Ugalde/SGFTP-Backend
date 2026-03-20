import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailProviderService } from './email-provider.service';
import { EmailLogService } from './email-log.service';
import { EmailSuppressionService } from './email-suppression.service';
import { EmailErrorType } from '../entities/email-log.entity';

export interface QueueEmailOptions {
  recipient: string;
  subject: string;
  htmlBody: string;
  module: string;
  emailType: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class EmailQueueService {
  constructor(
    private readonly provider: EmailProviderService,
    private readonly logService: EmailLogService,
    private readonly suppressionService: EmailSuppressionService,
  ) {}

  async queueEmail(options: QueueEmailOptions): Promise<void> {
    const { recipient, subject, htmlBody, module, emailType } = options;

    // 1. Format validation
    if (!EMAIL_REGEX.test(recipient)) {
      const log = await this.logService.create({
        recipient,
        subject,
        htmlBody,
        module,
        emailType,
      });
      await this.logService.markSuppressed(log.id);
      await this.suppressionService.suppress(recipient, 'Invalid email format');
      console.warn(`[EmailQueue] Invalid format suppressed: ${recipient}`);
      return;
    }

    // 2. Suppression check
    if (await this.suppressionService.isSuppressed(recipient)) {
      const log = await this.logService.create({
        recipient,
        subject,
        htmlBody,
        module,
        emailType,
      });
      await this.logService.markSuppressed(log.id);
      console.warn(`[EmailQueue] Suppressed address skipped: ${recipient}`);
      return;
    }

    // 3. Create log
    const log = await this.logService.create({
      recipient,
      subject,
      htmlBody,
      module,
      emailType,
    });

    // 4. Attempt immediate send
    try {
      await this.provider.sendMail({ to: recipient, subject, html: htmlBody });
      await this.logService.markSent(log.id);
      console.log(`[EmailQueue] Sent immediately: ${recipient} (${emailType})`);
    } catch (error: any) {
      const errorType = this.provider.classifyError(error);
      console.error(`[EmailQueue] Send failed (${errorType}): ${recipient} — ${error.message}`);

      if (errorType === EmailErrorType.PERMANENT) {
        await this.logService.markFailed(log.id, error.message, EmailErrorType.PERMANENT);
        await this.suppressionService.suppress(recipient, `Permanent error: ${error.message}`);
      } else {
        // Schedule first retry (+1 min)
        await this.logService.scheduleRetry(log);
      }
    }
  }

  @Cron('* * * * *')
  async processRetries(): Promise<void> {
    const pending = await this.logService.getPendingRetries();
    if (pending.length === 0) return;

    console.log(`[EmailQueue] Processing ${pending.length} retry(ies)...`);

    for (const log of pending) {
      // Suppression re-check
      if (await this.suppressionService.isSuppressed(log.recipient)) {
        await this.logService.markSuppressed(log.id);
        continue;
      }

      try {
        await this.provider.sendMail({
          to: log.recipient,
          subject: log.subject,
          html: log.htmlBody,
        });
        await this.logService.markSent(log.id);
        console.log(`[EmailQueue] Retry sent: ${log.recipient} (attempt ${log.retryCount + 1})`);
      } catch (error: any) {
        const errorType = this.provider.classifyError(error);
        console.error(`[EmailQueue] Retry failed (${errorType}): ${log.recipient} — ${error.message}`);

        if (errorType === EmailErrorType.PERMANENT || log.retryCount >= log.maxRetries) {
          await this.logService.markFailed(log.id, error.message, errorType as EmailErrorType);
          if (errorType === EmailErrorType.PERMANENT) {
            await this.suppressionService.suppress(log.recipient, `Permanent error: ${error.message}`);
          }
        } else {
          await this.logService.scheduleRetry(log);
        }
      }
    }
  }
}

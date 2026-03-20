import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  EmailLog,
  EmailStatus,
  EmailErrorType,
} from '../entities/email-log.entity';

export interface CreateEmailLogData {
  recipient: string;
  subject: string;
  htmlBody: string;
  module: string;
  emailType: string;
}

const BACKOFF_MINUTES = [1, 5, 30];

@Injectable()
export class EmailLogService {
  constructor(
    @InjectRepository(EmailLog)
    private logRepository: Repository<EmailLog>,
  ) {}

  async create(data: CreateEmailLogData): Promise<EmailLog> {
    return this.logRepository.save(
      this.logRepository.create({
        ...data,
        status: EmailStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
      }),
    );
  }

  async markSent(id: number): Promise<void> {
    await this.logRepository.update(id, {
      status: EmailStatus.SENT,
      sentAt: new Date(),
      lastError: null,
    });
  }

  async markFailed(
    id: number,
    error: string,
    errorType: EmailErrorType,
  ): Promise<void> {
    await this.logRepository.update(id, {
      status: EmailStatus.FAILED,
      lastError: error,
      errorType,
    });
  }

  async markSuppressed(id: number): Promise<void> {
    await this.logRepository.update(id, {
      status: EmailStatus.SUPPRESSED,
    });
  }

  async scheduleRetry(log: EmailLog): Promise<void> {
    const nextRetryCount = log.retryCount + 1;
    const backoffMinutes =
      BACKOFF_MINUTES[nextRetryCount - 1] ??
      BACKOFF_MINUTES[BACKOFF_MINUTES.length - 1];

    const nextAttemptAt = new Date();
    nextAttemptAt.setMinutes(nextAttemptAt.getMinutes() + backoffMinutes);

    await this.logRepository.update(log.id, {
      retryCount: nextRetryCount,
      nextAttemptAt,
      status: EmailStatus.PENDING,
    });
  }

  async getPendingRetries(): Promise<EmailLog[]> {
    return this.logRepository.find({
      where: {
        status: EmailStatus.PENDING,
        nextAttemptAt: LessThanOrEqual(new Date()),
      },
    });
  }
}

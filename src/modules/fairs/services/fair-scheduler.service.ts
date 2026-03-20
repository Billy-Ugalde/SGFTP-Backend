import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Fair } from '../entities/fair.entity';

@Injectable()
export class FairSchedulerService {
  private readonly logger = new Logger(FairSchedulerService.name);

  constructor(
    @InjectRepository(Fair)
    private fairRepository: Repository<Fair>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async deactivateExpiredFairs() {
    const now = new Date();

    const result = await this.fairRepository.update(
      { status: true, date: LessThan(now) },
      { status: false },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `Se desactivaron ${result.affected} feria(s) cuya hora de encuentro ya pasó.`,
      );
    }
  }
}

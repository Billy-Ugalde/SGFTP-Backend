import { Controller, Get } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @Public()
  getPublicStats() {
    return this.statsService.getPublicStats();
  }
}

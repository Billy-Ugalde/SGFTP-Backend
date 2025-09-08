import { SetMetadata } from '@nestjs/common';

export const RateLimit = (limit: number, windowMs: number = 15 * 60 * 1000) => 
  SetMetadata('rateLimit', limit) && SetMetadata('rateLimitWindow', windowMs);
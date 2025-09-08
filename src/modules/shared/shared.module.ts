// src/modules/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';

@Module({
  imports: [],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class SharedModule {}
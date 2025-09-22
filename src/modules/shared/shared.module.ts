// src/modules/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { GmailEmailProvider } from './providers/gmail-email.provider';

@Module({
  imports: [],
  providers: [PasswordService, GmailEmailProvider],
  exports: [PasswordService, GmailEmailProvider],
})
export class SharedModule {}
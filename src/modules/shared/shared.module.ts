// src/modules/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { GmailEmailProvider } from './providers/gmail-email.provider';
import { ParseJsonPipe } from './services/parse-json.pipe';
@Module({
  imports: [],
  providers: [PasswordService, GmailEmailProvider, ParseJsonPipe],
  exports: [PasswordService, GmailEmailProvider, ParseJsonPipe],
})
export class SharedModule {}
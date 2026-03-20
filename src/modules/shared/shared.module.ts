// src/modules/shared/shared.module.ts
import { Module } from '@nestjs/common';
import { PasswordService } from './services/password.service';
import { ParseJsonPipe } from './services/parse-json.pipe';
import { EmailModule } from './email/email.module';

@Module({
  imports: [EmailModule],
  providers: [PasswordService, ParseJsonPipe],
  exports: [PasswordService, ParseJsonPipe, EmailModule],
})
export class SharedModule {}

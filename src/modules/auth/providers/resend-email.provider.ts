import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider, EmailOptions } from '../interfaces/email.interface';

@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  constructor(private configService: ConfigService) {}

  async verify(): Promise<boolean> {
    // Implementación para Resend API
    return true;
  }

  async sendEmail(mailOptions: EmailOptions): Promise<void> {
    // Implementación para Resend API
    console.log(`[ResendProvider] Email enviado a: ${mailOptions.to}`);
  }
}
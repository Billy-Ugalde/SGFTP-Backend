import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { EmailQueueService } from '../../shared/email/services/email-queue.service';
import { EmailTemplateService } from '../../shared/email/services/email-template.service';

@Injectable()
export class AuthEmailService {
  private readonly templatesPath = join(
    process.cwd(),
    'src',
    'modules',
    'auth',
    'templates',
  );

  constructor(
    private readonly emailQueue: EmailQueueService,
    private readonly emailTemplate: EmailTemplateService,
  ) {}

  private formatRolesForDisplay(userRoles: string[]): string {
    const roleTranslations: Record<string, string> = {
      super_admin: 'Super Administrador',
      general_admin: 'Administrador General',
      fair_admin: 'Administrador de Ferias',
      content_admin: 'Administrador de Contenido',
      auditor: 'Auditor',
      entrepreneur: 'Emprendedor',
      volunteer: 'Voluntario',
    };
    return userRoles.map((r) => roleTranslations[r] || r).join(', ');
  }

  async sendAccountActivationEmail(
    recipientEmail: string,
    recipientName: string,
    activationLink: string,
    userRoles: string[],
  ): Promise<void> {
    const html = this.emailTemplate.render(
      join(this.templatesPath, 'activation.template.html'),
      {
        RECIPIENT_NAME: recipientName,
        RECIPIENT_EMAIL: recipientEmail,
        ACTIVATION_LINK: activationLink,
        ROLES_DISPLAY: this.formatRolesForDisplay(userRoles),
      },
    );

    await this.emailQueue.queueEmail({
      recipient: recipientEmail,
      subject: 'Activación de cuenta - Fundación Tamarindo Park',
      htmlBody: html,
      module: 'auth',
      emailType: 'activation',
    });
  }

  async sendPasswordResetEmail(
    recipientEmail: string,
    recipientName: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const requestDate = new Date().toLocaleString('es-CR', {
      timeZone: 'America/Costa_Rica',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = this.emailTemplate.render(
      join(this.templatesPath, 'password-reset.template.html'),
      {
        RECIPIENT_NAME: recipientName,
        RECIPIENT_EMAIL: recipientEmail,
        RESET_LINK: resetLink,
        REQUEST_DATE: requestDate,
      },
    );

    await this.emailQueue.queueEmail({
      recipient: recipientEmail,
      subject: 'Restablecer Contraseña - Fundación Tamarindo Park',
      htmlBody: html,
      module: 'auth',
      emailType: 'password-reset',
    });
  }

  async sendPasswordChangeNotification(
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    const changeDate = new Date().toLocaleString('es-CR', {
      timeZone: 'America/Costa_Rica',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = this.emailTemplate.render(
      join(this.templatesPath, 'password-change.template.html'),
      {
        RECIPIENT_NAME: recipientName,
        RECIPIENT_EMAIL: recipientEmail,
        CHANGE_DATE: changeDate,
      },
    );

    await this.emailQueue.queueEmail({
      recipient: recipientEmail,
      subject: 'Contraseña Cambiada - Fundación Tamarindo Park',
      htmlBody: html,
      module: 'auth',
      emailType: 'password-change',
    });
  }

  async sendEmailVerificationEmail(
    _recipientEmail: string,
    _recipientName: string,
    _verificationToken: string,
  ): Promise<void> {
    // Implementar después
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GmailEmailProvider } from '../../shared/providers/gmail-email.provider';

@Injectable()
export class AuthEmailService {
  constructor(
    private configService: ConfigService,
    private gmailProvider: GmailEmailProvider,
  ) {}

  private formatRolesForDisplay(userRoles: string[]): string {
    const roleTranslations: Record<string, string> = {
        'super_admin': 'Super Administrador',
        'general_admin': 'Administrador General', 
        'fair_admin': 'Administrador de Ferias',
        'content_admin': 'Administrador de Contenido',
        'auditor': 'Auditor',
        'entrepreneur': 'Emprendedor',
        'volunteer': 'Voluntario'
    };

    return userRoles
        .map(role => roleTranslations[role] || role)
        .join(', ');
  }

  async sendAccountActivationEmail(
    recipientEmail: string,
    recipientName: string,
    activationLink: string,
    userRoles: string[]
  ): Promise<void> {
    console.log('📧 [EMAIL-SERVICE] Preparando email de activación...');
    console.log('  📮 Para:', recipientEmail);
    console.log('  👤 Nombre:', recipientName);
    console.log('  🔗 Link:', activationLink);
    console.log('  👥 Roles:', userRoles);

    const subject = 'Activación de cuenta - Fundación Tamarindo Park';
    const html = this.buildActivationEmailTemplate(
      recipientEmail,
      recipientName,
      activationLink,
      userRoles
    );

    console.log('📤 [EMAIL-SERVICE] Enviando email...');
    await this.gmailProvider.sendEmail(recipientEmail, subject, html);
    console.log('✅ [EMAIL-SERVICE] Email enviado correctamente');
  }

  async sendEmailVerificationEmail(
    recipientEmail: string,
    recipientName: string,
    verificationToken: string
  ): Promise<void> {
    // Implementar después
  }

  async sendPasswordChangeNotification(
    recipientEmail: string,
    recipientName: string
    ): Promise<void> {
    const subject = 'Contraseña Cambiada - Fundación Tamarindo Park';
    const html = this.buildPasswordChangeNotificationTemplate(
        recipientEmail,
        recipientName
    );

    await this.gmailProvider.sendEmail(recipientEmail, subject, html);
  }

  async sendPasswordResetEmail(
    recipientEmail: string,
    recipientName: string,
    resetToken: string
    ): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Restablecer Contraseña - Fundación Tamarindo Park';
    const html = this.buildPasswordResetTemplate(
        recipientEmail,
        recipientName,
        resetLink
    );

    await this.gmailProvider.sendEmail(recipientEmail, subject, html);
    }

  private buildActivationEmailTemplate(
    recipientEmail: string,
    recipientName: string,
    activationLink: string,
    userRoles: string[]
    ): string {
    const rolesDisplay = this.formatRolesForDisplay(userRoles);

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activación de Cuenta</title>
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8fafc;
        }

        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: #52AC83;
            padding: 40px 30px;
            text-align: center;
        }

        .logo h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .logo p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }

        .content {
            padding: 30px 25px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 30px;
            color: #34495e;
        }

        .welcome-box {
            background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
            border: 2px solid #28a745;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }

        .welcome-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }

        .welcome-title {
            color: #155724;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .credentials-section {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #0A4558;
        }

        .credentials-title {
            color: #0A4558;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }

        .credential-item {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .credential-label {
            color: #6c757d;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .credential-value {
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            word-break: break-all;
        }

        .roles-section {
            background: linear-gradient(135deg, #dbecff 0%, #cef3ff 100%);
            border: 1px solid #0A4558;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
        }

        .roles-title {
            color: #0A4558;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .roles-list {
            color: #0A4558;
            font-size: 14px;
            font-weight: 500;
        }

        .login-button {
            display: inline-block;
            background: #52AC83;
            color: #ffffff !important; 
            border: 2px solid #52AC83;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(82, 172, 131, 0.3);
            transition: all 0.2s ease-in-out;
        }
        
        

        .login-button:hover {
            background: #0A4558;
            transform: scale(1.03);
        }

        .security-notice {
            background: linear-gradient(135deg, #f8d7da 0%, #f1c2c7 100%);
            border: 1px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }

        .security-notice-title {
            color: #721c24;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .security-notice p {
            color: #721c24;
            font-size: 14px;
            margin: 8px 0;
        }

        .footer {
            background: #f8fafc;
            border-top: 1px solid #e9ecef;
            padding: 30px;
            text-align: center;
        }

        .footer-content {
            color: #6c757d;
            font-size: 13px;
            line-height: 1.5;
        }

        .footer-title {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
        }

        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
            margin: 25px 0;
        }

        @media (max-width: 600px) {
            .email-container {
            margin: 20px;
            border-radius: 12px;
            }

            .header {
            padding: 30px 20px;
            }

            .content {
            padding: 25px 20px;
            }

            .welcome-title {
            font-size: 20px;
            }

            .login-button {
            display: block;
            width: 100%;
            }
        }
        </style>
    </head>
    <body>
        <div class="email-container">
        <div class="header">
            <div class="logo">
            <h1>Fundación Tamarindo Park</h1>
            <p>Sistema de Gestión de Ferias</p>
            </div>
        </div>

        <div class="content">
            <p class="greeting">Estimado/a <strong>${recipientName}</strong>,</p>

            <div class="welcome-box">
            <span class="welcome-icon">🎉</span>
            <h2 class="welcome-title">¡Bienvenido/a a Fundación Tamarindo Park!</h2>
            <p>Tu cuenta ha sido creada exitosamente en nuestro sistema.</p>
            </div>

            <div class="credentials-section">
            <h3 class="credentials-title">🔑 Información de Acceso</h3>

            <div class="credential-item">
                <div class="credential-label">Usuario (Email)</div>
                <div class="credential-value">${recipientEmail}</div>
            </div>

            <p style="color: #495057; font-size: 14px; margin-top: 15px;">
                Para completar la activación de tu cuenta, deberás crear una contraseña segura usando el enlace de abajo.
            </p>
            </div>

            <div class="roles-section">
            <h3 class="roles-title">👤 Roles Asignados</h3>
            <p class="roles-list">${rolesDisplay}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
            <a href="${activationLink}" class="login-button">Activar Cuenta</a>
            </div>

            <div class="security-notice">
            <h3 class="security-notice-title">🔒 Importante - Seguridad</h3>
            <p><strong>Enlace de activación:</strong> Este enlace te permitirá crear tu contraseña y activar tu cuenta.</p>
            <p><strong>Válido por:</strong> Este enlace expira en 24 horas por seguridad.</p>
            <p><strong>Un solo uso:</strong> Una vez activada tu cuenta, este enlace quedará invalidado.</p>
            </div>

            <div class="divider"></div>

            <p style="font-size: 15px; color: #5a6c7d; line-height: 1.6;">
            Si tienes problemas para acceder o necesitas ayuda, contacta al administrador del sistema.
            </p>
        </div>

        <div class="footer">
            <div class="footer-content">
            <p class="footer-title">Fundación Tamarindo Park</p>
            <p>Sistema de Autenticación</p>
            <p style="margin-top: 10px; font-size: 12px; color: #95a5a6;">
                Este es un mensaje automático de seguridad. No responder a este correo.
            </p>
            </div>
        </div>
        </div>
    </body>
    </html>
    `;
    }

  private buildPasswordChangeNotificationTemplate(
    recipientEmail: string,
    recipientName: string
    ): string {
    const currentDate = new Date().toLocaleString('es-CR', {
        timeZone: 'America/Costa_Rica',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Cambiada</title>
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8fafc;
        }

        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: #e74c3c;
            padding: 40px 30px;
            text-align: center;
        }

        .logo h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .logo p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }

        .content {
            padding: 30px 25px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 30px;
            color: #34495e;
        }

        .security-alert {
            background: linear-gradient(135deg, #fef9e7 0%, #fcf4e4 100%);
            border: 2px solid #f39c12;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }

        .alert-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }

        .alert-title {
            color: #d68910;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .info-section {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #0A4558;
        }

        .info-title {
            color: #0A4558;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
        }

        .info-item {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .info-label {
            color: #6c757d;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .info-value {
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
        }

        .security-tips {
            background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
            border: 1px solid #28a745;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
        }

        .tips-title {
            color: #155724;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
        }

        .tips-list {
            color: #155724;
            font-size: 14px;
            line-height: 1.6;
            padding-left: 0;
            list-style: none;
        }

        .tips-list li {
            margin-bottom: 8px;
            position: relative;
            padding-left: 20px;
        }

        .tips-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #28a745;
            font-weight: bold;
        }

        .action-needed {
            background: linear-gradient(135deg, #f8d7da 0%, #f1c2c7 100%);
            border: 1px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }

        .action-title {
            color: #721c24;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .action-needed p {
            color: #721c24;
            font-size: 14px;
            margin: 8px 0;
        }

        .footer {
            background: #f8fafc;
            border-top: 1px solid #e9ecef;
            padding: 30px;
            text-align: center;
        }

        .footer-content {
            color: #6c757d;
            font-size: 13px;
            line-height: 1.5;
        }

        .footer-title {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
        }

        @media (max-width: 600px) {
            .email-container {
            margin: 20px;
            border-radius: 12px;
            }

            .header {
            padding: 30px 20px;
            }

            .content {
            padding: 25px 20px;
            }

            .alert-title {
            font-size: 20px;
            }
        }
        </style>
    </head>
    <body>
        <div class="email-container">
        <div class="header">
            <div class="logo">
            <h1>Fundación Tamarindo Park</h1>
            <p>Notificación de Seguridad</p>
            </div>
        </div>

        <div class="content">
            <p class="greeting">Estimado/a <strong>${recipientName}</strong>,</p>

            <div class="security-alert">
            <span class="alert-icon">🔐</span>
            <h2 class="alert-title">Contraseña Cambiada Exitosamente</h2>
            <p>Tu contraseña ha sido actualizada correctamente.</p>
            </div>

            <div class="info-section">
            <h3 class="info-title">📋 Detalles del Cambio</h3>

            <div class="info-item">
                <div class="info-label">Cuenta</div>
                <div class="info-value">${recipientEmail}</div>
            </div>

            <div class="info-item">
                <div class="info-label">Fecha y Hora</div>
                <div class="info-value">${currentDate}</div>
            </div>
            </div>

            <div class="security-tips">
            <h3 class="tips-title">🛡️ Recomendaciones de Seguridad</h3>
            <ul class="tips-list">
                <li>Mantén tu contraseña segura y no la compartas con nadie</li>
                <li>Usa una contraseña única para cada cuenta</li>
                <li>Considera usar un administrador de contraseñas</li>
                <li>Cierra sesión cuando uses computadoras públicas</li>
            </ul>
            </div>

            <div class="action-needed">
            <h3 class="action-title">⚠️ ¿No fuiste tú?</h3>
            <p><strong>Si no realizaste este cambio:</strong></p>
            <p>1. Contacta inmediatamente al administrador del sistema</p>
            <p>2. Verifica que nadie más tenga acceso a tu cuenta de email</p>
            <p>3. Considera cambiar también la contraseña de tu email</p>
            </div>

            <p style="font-size: 15px; color: #5a6c7d; line-height: 1.6; margin-top: 30px;">
            Esta es una notificación automática de seguridad. Si tienes preguntas, contacta al soporte técnico.
            </p>
        </div>

        <div class="footer">
            <div class="footer-content">
            <p class="footer-title">Fundación Tamarindo Park</p>
            <p>Sistema de Autenticación</p>
            <p style="margin-top: 10px; font-size: 12px; color: #95a5a6;">
                Este es un mensaje automático de seguridad. No responder a este correo.
            </p>
            </div>
        </div>
        </div>
    </body>
    </html>
    `;
    }

    private buildPasswordResetTemplate(
    recipientEmail: string,
    recipientName: string,
    resetLink: string
    ): string {
    const currentDate = new Date().toLocaleString('es-CR', {
        timeZone: 'America/Costa_Rica',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña</title>
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background-color: #f8fafc;
        }

        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: #3498db;
            padding: 40px 30px;
            text-align: center;
        }

        .logo h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .logo p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }

        .content {
            padding: 30px 25px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 30px;
            color: #34495e;
        }

        .reset-alert {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 2px solid #f39c12;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }

        .alert-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }

        .alert-title {
            color: #d68910;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .alert-subtitle {
            color: #8b7355;
            font-size: 14px;
            margin-bottom: 20px;
        }

        .reset-button {
            display: inline-block;
            background: #3498db;
            color: #ffffff !important;
            border: 2px solid #3498db;
            text-decoration: none;
            padding: 18px 40px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            text-align: center;
            margin: 25px 0;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
            transition: all 0.2s ease-in-out;
        }

        .reset-button:hover {
            background: #2980b9;
            transform: scale(1.03);
        }

        .info-section {
            background: #f8fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
            border-left: 4px solid #0A4558;
        }

        .info-title {
            color: #0A4558;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
        }

        .info-item {
            background: #ffffff;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .info-label {
            color: #6c757d;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .info-value {
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
        }

        .security-notice {
            background: linear-gradient(135deg, #f8d7da 0%, #f1c2c7 100%);
            border: 1px solid #dc3545;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }

        .security-notice-title {
            color: #721c24;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
        }

        .security-notice p {
            color: #721c24;
            font-size: 14px;
            margin: 8px 0;
        }

        .security-tips {
            background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
            border: 1px solid #28a745;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
        }

        .tips-title {
            color: #155724;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
        }

        .tips-list {
            color: #155724;
            font-size: 14px;
            line-height: 1.6;
            padding-left: 0;
            list-style: none;
        }

        .tips-list li {
            margin-bottom: 8px;
            position: relative;
            padding-left: 20px;
        }

        .tips-list li:before {
            content: "🔒";
            position: absolute;
            left: 0;
        }

        .footer {
            background: #f8fafc;
            border-top: 1px solid #e9ecef;
            padding: 30px;
            text-align: center;
        }

        .footer-content {
            color: #6c757d;
            font-size: 13px;
            line-height: 1.5;
        }

        .footer-title {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
        }

        .link-alternative {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            word-break: break-all;
        }

        .link-title {
            color: #495057;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .link-url {
            color: #007bff;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            background: #ffffff;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }

        @media (max-width: 600px) {
            .email-container {
            margin: 20px;
            border-radius: 12px;
            }

            .header {
            padding: 30px 20px;
            }

            .content {
            padding: 25px 20px;
            }

            .alert-title {
            font-size: 20px;
            }

            .reset-button {
            display: block;
            width: 100%;
            padding: 15px;
            font-size: 16px;
            }
        }
        </style>
    </head>
    <body>
        <div class="email-container">
        <div class="header">
            <div class="logo">
            <h1>Fundación Tamarindo Park</h1>
            <p>Restablecimiento de Contraseña</p>
            </div>
        </div>

        <div class="content">
            <p class="greeting">Estimado/a <strong>${recipientName}</strong>,</p>

            <div class="reset-alert">
            <span class="alert-icon">🔑</span>
            <h2 class="alert-title">Solicitud de Restablecimiento</h2>
            <p class="alert-subtitle">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
            </div>

            <div class="info-section">
            <h3 class="info-title">📋 Detalles de la Solicitud</h3>

            <div class="info-item">
                <div class="info-label">Cuenta</div>
                <div class="info-value">${recipientEmail}</div>
            </div>

            <div class="info-item">
                <div class="info-label">Fecha y Hora</div>
                <div class="info-value">${currentDate}</div>
            </div>

            <div class="info-item">
                <div class="info-label">Válido hasta</div>
                <div class="info-value">15 minutos desde ahora</div>
            </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="reset-button">Restablecer Contraseña</a>
            </div>

            <div class="link-alternative">
            <div class="link-title">Si el botón no funciona, copia y pega este enlace:</div>
            <div class="link-url">${resetLink}</div>
            </div>

            <div class="security-tips">
            <h3 class="tips-title">🛡️ Consejos de Seguridad</h3>
            <ul class="tips-list">
                <li>Usa una contraseña única que no hayas usado antes</li>
                <li>Combina letras mayúsculas, minúsculas, números y símbolos</li>
                <li>Evita información personal como nombres o fechas</li>
                <li>Considera usar un administrador de contraseñas</li>
            </ul>
            </div>

            <div class="security-notice">
            <h3 class="security-notice-title">⚠️ Importante</h3>
            <p><strong>¿No solicitaste este cambio?</strong> Si no fuiste tú quien solicitó el restablecimiento, ignora este email y tu contraseña permanecerá sin cambios.</p>
            <p><strong>Enlace temporal:</strong> Este enlace expira en 15 minutos por seguridad.</p>
            <p><strong>Un solo uso:</strong> El enlace se invalidará después de usarlo.</p>
            </div>

            <p style="font-size: 15px; color: #5a6c7d; line-height: 1.6; margin-top: 30px;">
            Si tienes problemas para restablecer tu contraseña, contacta al administrador del sistema.
            </p>
        </div>

        <div class="footer">
            <div class="footer-content">
            <p class="footer-title">Fundación Tamarindo Park</p>
            <p>Sistema de Autenticación</p>
            <p style="margin-top: 10px; font-size: 12px; color: #95a5a6;">
                Este es un mensaje automático de seguridad. No responder a este correo.
            </p>
            </div>
        </div>
        </div>
    </body>
    </html>
    `;
    }
}
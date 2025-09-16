import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GmailEmailProvider } from '../../shared/providers/gmail-email.provider';

@Injectable()
export class AuthEmailService {
  constructor(
    private configService: ConfigService,
    private gmailProvider: GmailEmailProvider,
  ) {}

  async sendAccountActivationEmail(
    recipientEmail: string,
    recipientName: string,
    temporaryPassword: string,
    userRoles: string[]
  ): Promise<void> {
    const subject = 'Activación de cuenta - Fundación Tamarindo Park';
    const html = this.buildActivationEmailTemplate(
      recipientEmail,
      recipientName,
      temporaryPassword,
      userRoles
    );

    await this.gmailProvider.sendEmail(recipientEmail, subject, html);
  }

  async sendPasswordResetEmail(
    recipientEmail: string,
    recipientName: string,
    resetToken: string
  ): Promise<void> {
    // Implementar después
  }

  async sendEmailVerificationEmail(
    recipientEmail: string,
    recipientName: string,
    verificationToken: string
  ): Promise<void> {
    // Implementar después
  }

  private buildActivationEmailTemplate(
    recipientEmail: string,
    recipientName: string,
    temporaryPassword: string,
    userRoles: string[]
    ): string {
    const rolesDisplay = this.formatRolesForDisplay(userRoles);
    const loginUrl =
        this.configService.get('FRONTEND_URL', 'http://localhost:5173') + '/login';

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
            <h2 class="welcome-title">¡Cuenta Activada!</h2>
            <p>Tu cuenta ha sido creada exitosamente en nuestro sistema.</p>
            </div>

            <div class="credentials-section">
            <h3 class="credentials-title">🔐 Credenciales de Acceso</h3>

            <div class="credential-item">
                <div class="credential-label">Usuario (Email)</div>
                <div class="credential-value">${recipientEmail}</div>
            </div>

            <div class="credential-item">
                <div class="credential-label">Contraseña Temporal</div>
                <div class="credential-value">${temporaryPassword}</div>
            </div>
            </div>

            <div class="roles-section">
            <h3 class="roles-title">👤 Roles Asignados</h3>
            <p class="roles-list">${rolesDisplay}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="login-button">Iniciar Sesión Ahora</a>
            </div>

            <div class="security-notice">
            <h3 class="security-notice-title">🔒 Importante - Seguridad</h3>
            <p><strong>Cambio de contraseña obligatorio:</strong> Deberás cambiar esta contraseña temporal en tu primer inicio de sesión.</p>
            <p><strong>Guarda estas credenciales:</strong> Anota esta información en un lugar seguro hasta completar el cambio de contraseña.</p>
            <p><strong>Válido por:</strong> Estas credenciales temporales expiran en 48 horas.</p>
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
}
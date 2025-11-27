import { Injectable } from '@nestjs/common';
import { CampaignLanguage } from '../entities/newsletter-campaign.entity';

@Injectable()
export class NewsletterTemplateService {

  generateNewsletterEmail(
    recipientName: string,
    subject: string,
    content: string,
    language: CampaignLanguage
  ): string {
    const isSpanish = language === CampaignLanguage.SPANISH;

    return `
    <!DOCTYPE html>
    <html lang="${isSpanish ? 'es' : 'en'}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
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
            background: linear-gradient(135deg, #52AC83 0%, #0A4558 100%);
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
            padding: 40px 30px;
        }

        .greeting {
            font-size: 18px;
            margin-bottom: 25px;
            color: #34495e;
        }

        .message-content {
            font-size: 15px;
            line-height: 1.8;
            color: #5a6c7d;
            margin-bottom: 30px;
            white-space: pre-wrap;
        }

        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e9ecef, transparent);
            margin: 30px 0;
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
            margin-bottom: 10px;
        }

        .social-links {
            margin: 20px 0;
        }

        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #52AC83;
            text-decoration: none;
            font-size: 14px;
        }

        .unsubscribe {
            margin-top: 20px;
            font-size: 12px;
            color: #95a5a6;
        }

        .unsubscribe a {
            color: #95a5a6;
            text-decoration: underline;
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

            .logo h1 {
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
                    <p>${isSpanish ? 'Transformando comunidades' : 'Transforming communities'}</p>
                </div>
            </div>

            <div class="content">
                <p class="greeting">${isSpanish ? 'Hola' : 'Hello'} <strong>${recipientName}</strong>,</p>

                <div class="message-content">${content}</div>

                <div class="divider"></div>

                <p style="font-size: 14px; color: #5a6c7d; text-align: center;">
                    ${isSpanish
                        ? 'Gracias por ser parte de nuestra comunidad.'
                        : 'Thank you for being part of our community.'}
                </p>
            </div>

            <div class="footer">
                <div class="footer-content">
                    <p class="footer-title">Fundación Tamarindo Park</p>
                    <p>${isSpanish ? 'Desarrollo Sostenible Integral' : 'Comprehensive Sustainable Development'}</p>

                    <div class="social-links">
                        <a href="#">${isSpanish ? 'Sitio Web' : 'Website'}</a> •
                        <a href="#">Facebook</a> •
                        <a href="#">Instagram</a>
                    </div>

                    <div class="unsubscribe">
                        <p>
                            ${isSpanish
                                ? 'Si no deseas recibir más correos, puedes '
                                : 'If you no longer wish to receive emails, you can '}
                            <a href="#">${isSpanish ? 'darte de baja aquí' : 'unsubscribe here'}</a>
                        </p>
                    </div>

                    <p style="margin-top: 15px; font-size: 12px; color: #95a5a6;">
                        ${isSpanish
                            ? 'Este es un correo informativo de la Fundación Tamarindo Park.'
                            : 'This is an informational email from Fundación Tamarindo Park.'}
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

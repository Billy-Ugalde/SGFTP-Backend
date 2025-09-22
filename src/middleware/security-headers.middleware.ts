import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    
    // CSP dinámico basado en entorno
    const cspDirectives = [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      `connect-src 'self' ${frontendUrl}`,
      "frame-ancestors 'none'"
    ];

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    
    // Headers básicos de seguridad
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // HSTS solo en producción con HTTPS
    if (isProduction) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    next();
  }
}
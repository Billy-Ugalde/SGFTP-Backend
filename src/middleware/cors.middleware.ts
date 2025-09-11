import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    const additionalOrigins = this.configService.get('ADDITIONAL_ORIGINS');
    
    this.allowedOrigins = [
      frontendUrl,
      ...(additionalOrigins ? additionalOrigins.split(',') : [])
    ].filter(Boolean);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // Validación estricta de origen para cookies
    if (origin && this.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      
      // CRÍTICO: Credentials solo con origen específico, nunca con wildcard
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!isProduction && origin?.startsWith('http://localhost:')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Sin origen válido = sin credentials
      return res.status(403).json({ 
        message: 'Origen no permitido',
        error: 'CORS_ORIGIN_NOT_ALLOWED' 
      });
    }

    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie'
    );

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );

    // Preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }
}
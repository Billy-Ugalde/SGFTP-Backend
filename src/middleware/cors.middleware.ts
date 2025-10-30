import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly frontendUrl: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
  }

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // Si no hay Origin header, es un request same-origin o de navegación directa
    // Estos requests son seguros y deben permitirse
    if (!origin) {
      // Request sin Origin (same-origin, navegación directa, o recursos estáticos)
      // No necesita headers CORS, pero sí puede continuar
      return next();
    }

    // Validación de origen para requests cross-origin
    if (origin === this.frontendUrl) {
      // Origen exacto configurado
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!this.isProduction && origin.startsWith('http://localhost:')) {
      // En desarrollo, permitir cualquier localhost
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Origen cross-origin no permitido
      console.error(`[CORS] Origen rechazado: ${origin}`);
      return res.status(403).json({
        message: 'Origen no permitido',
        error: 'CORS_ORIGIN_NOT_ALLOWED',
        receivedOrigin: origin,
        expectedOrigin: this.frontendUrl
      });
    }

    // Headers permitidos (incluye Cookie para autenticación)
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie'
    );

    // Métodos HTTP permitidos
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );

    // Headers expuestos (para que el frontend pueda leerlos)
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Disposition'
    );

    // Preflight request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }
}
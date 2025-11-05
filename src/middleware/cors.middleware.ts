import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';

    // Lista de orígenes permitidos
    this.allowedOrigins = [
      frontendUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];

    // Agregar orígenes adicionales si están configurados
    const additionalOrigins = this.configService.get('ADDITIONAL_ORIGINS');
    if (additionalOrigins) {
      const origins = additionalOrigins.split(',').map(o => o.trim());
      this.allowedOrigins.push(...origins);
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // Si no hay Origin header, es un request same-origin o de navegación directa
    if (!origin) {
      return next();
    }

    // Verificar si el origen está en la lista de permitidos
    if (this.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      // Origen no permitido
      console.error(`[CORS] Origen rechazado: ${origin}`);
      console.error(`[CORS] Orígenes permitidos:`, this.allowedOrigins);
      return res.status(403).json({
        message: 'Origen no permitido',
        error: 'CORS_ORIGIN_NOT_ALLOWED',
        receivedOrigin: origin,
        allowedOrigins: this.allowedOrigins
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
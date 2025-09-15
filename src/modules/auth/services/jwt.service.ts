// src/auth/services/jwt.service.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { jwtConfig } from '../config/jwt.config';
import { ConfigService } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string;        
  email: string;
  roles: string[];    
  primaryRole: string; 
  type: 'access' | 'refresh';
  iat?: number;       
  exp?: number;       
}

@Injectable()
export class JwtTokenService {
  private readonly logger = new Logger(JwtTokenService.name);
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: User): string {
    const jwtData = user.toJwtPayload();
    
    const payload: JwtPayload = {
        sub: jwtData.sub,
        email: jwtData.email,
        roles: jwtData.roles,          
        primaryRole: jwtData.primaryRole, 
        type: 'access',
    };

    return this.jwtService.sign(payload, {
        secret: this.getTokenSecret(),
        expiresIn: this.getAccessTokenExpiry(),
    });
  }

  // Genera refresh token
  generateRefreshToken(user: User): string {
    const jwtData = user.toJwtPayload();

    const payload: JwtPayload = {
      sub: jwtData.sub,
      email: jwtData.email,
      roles: jwtData.roles,           
      primaryRole: jwtData.primaryRole, 
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.getTokenSecret(),
      expiresIn: this.getRefreshTokenExpiry(),
    });

    return token;
  }

  /**
   * Verifica access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.getTokenSecret(),
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Tipo de token inválido');
      }

      return payload;
    } catch (error) {
      if (this.isDev) {
        this.logger.warn(`Token access inválido: ${error.message}`);
      }
      throw new UnauthorizedException('Token de acceso inválido');
    }
  }

  /**
   * Verifica refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.getTokenSecret(),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Tipo de token inválido');
      }

      return payload;
    } catch (error) {
      if (this.isDev) {
        this.logger.warn(`Refresh token inválido: ${error.message}`);
      }
      throw new UnauthorizedException('Token de actualización inválido');
    }
  }

  // Métodos privados para configuración
  private getTokenSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
        throw new Error('JWT_SECRET no configurado en variables de entorno');
    }
    return secret;
  }

  private getAccessTokenExpiry(): string {
    return this.isDev 
      ? jwtConfig.development.accessToken.expiresIn
      : jwtConfig.production.accessToken.expiresIn;
  }

  private getRefreshTokenExpiry(): string {
    return this.isDev 
      ? jwtConfig.development.refreshToken.expiresIn
      : jwtConfig.production.refreshToken.expiresIn;
  }
}
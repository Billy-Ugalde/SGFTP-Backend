import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    try {
      const user = await this.authService.validateAccessToken(token);
      
      if (!user) {
        throw new UnauthorizedException('Token inválido o expirado');
      }

      // Adjuntar usuario al request para uso posterior
      request.user = user;
      return true;

    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
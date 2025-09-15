import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: User = request.user;

        if (!user) {
            throw new ForbiddenException('Usuario no autenticado');
        }

        // ✅ CAMBIO CRÍTICO: Verificar contra todos los roles del usuario
        const hasRole = requiredRoles.some(role => user.hasRole(role));
        
        if (!hasRole) {
            throw new ForbiddenException(
                `Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`
            );
        }

        return true;
    }
}
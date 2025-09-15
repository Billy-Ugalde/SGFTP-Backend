import { Injectable } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class PermissionService {
    
    /**
     * Matriz de permisos por rol individual
     */
    private readonly PERMISSIONS_BY_ROLE = {
        [UserRole.SUPER_ADMIN]: [
            // Gestión de usuarios
            'users.view',
            'users.create',
            'users.update',
            'users.enable',
            'users.disable',
            
            // Control total sobre entrepreneurs
            'entrepreneurs.view',
            'entrepreneurs.create',
            'entrepreneurs.update_personal',
            'entrepreneurs.update_business',
            'entrepreneurs.enable',
            'entrepreneurs.disable',
            
            // Control total sobre ferias
            'fairs.view',
            'fairs.create',
            'fairs.update',
            'fairs.enable',
            'fairs.disable',
            'fairs.manage_participants',
            
            // Aplicaciones
            'applications.view',
            'applications.approve',
            'applications.reject',
            
            // Volunteers
            'volunteers.view',
            'volunteers.create',
            'volunteers.update',
            'volunteers.enable',
            'volunteers.disable',
            
            // Contenido
            'content.view',
            'content.create',
            'content.update',
            'content.publish',
            'content.disable',
            
            // Newsletters
            'newsletters.view',
            'newsletters.create',
            'newsletters.send',
            
            // Donaciones
            'donations.view',
            'donations.create',
            'donations.update',
            
            // Auditoría
            'audit.view_reports',
            'audit.view_statistics',
            'audit.view_logs'
        ],

        [UserRole.GENERAL_ADMIN]: [
            // Ferias (sin habilitar/deshabilitar)
            'fairs.view',
            'fairs.create',
            'fairs.update',
            'fairs.manage_participants',
            
            // Aplicaciones
            'applications.view',
            'applications.approve',
            'applications.reject',
            
            // Volunteers (solo ver)
            'volunteers.view',
            
            // Contenido
            'content.view',
            'content.create',
            'content.update',
            'content.publish',
            
            // Newsletters
            'newsletters.view',
            'newsletters.create',
            'newsletters.send',
            
            // Donaciones
            'donations.view',
            'donations.create',
            'donations.update',
            
            // Auditoría básica
            'audit.view_reports',
            'audit.view_statistics'
        ],

        [UserRole.FAIR_ADMIN]: [
            // Control total sobre entrepreneurs
            'entrepreneurs.view',
            'entrepreneurs.create',
            'entrepreneurs.update_personal',
            'entrepreneurs.update_business',
            'entrepreneurs.enable',
            'entrepreneurs.disable',
            
            // Control total sobre ferias
            'fairs.view',
            'fairs.create',
            'fairs.update',
            'fairs.enable',
            'fairs.disable',
            'fairs.manage_participants',
            
            // Aplicaciones
            'applications.view',
            'applications.approve',
            'applications.reject'
        ],

        [UserRole.CONTENT_ADMIN]: [
            // Solo contenido
            'content.view',
            'content.create',
            'content.update',
            'content.publish',
            
            // Newsletters
            'newsletters.view',
            'newsletters.create',
            'newsletters.send'
        ],

        [UserRole.AUDITOR]: [
            // Solo lectura
            'entrepreneurs.view',
            'fairs.view',
            'volunteers.view',
            'content.view',
            'donations.view',
            'audit.view_reports',
            'audit.view_statistics',
            'audit.view_logs'
        ],

        [UserRole.ENTREPRENEUR]: [
            // Solo su perfil y funcionalidades propias
            'profile.view',
            'profile.update',
            'entrepreneurs.view_own',
            'applications.create',
            'applications.view_own'
        ],

        [UserRole.VOLUNTEER]: [
            // Solo su perfil y voluntariado
            'profile.view',
            'profile.update',
            'volunteers.view_opportunities',
            'volunteers.participate',
            'volunteers.view_own'
        ]
    };

    /**
     * Obtiene permisos de un rol específico
     */
    getSingleRolePermissions(roleName: string): string[] {
        return this.PERMISSIONS_BY_ROLE[roleName] || [];
    }

    /**
     * Combina permisos de múltiples roles (sin duplicados)
     */
    getPermissionsByRoles(roleNames: string[]): string[] {
        const allPermissions = new Set<string>();
        
        roleNames.forEach(roleName => {
            const rolePermissions = this.getSingleRolePermissions(roleName);
            rolePermissions.forEach(permission => allPermissions.add(permission));
        });
        
        return Array.from(allPermissions).sort();
    }

    /**
     * Obtiene todos los permisos de un usuario
     */
    getUserPermissions(user: User): string[] {
        return this.getPermissionsByRoles(user.getAllRoleNames());
    }

    /**
     * Verifica si un usuario tiene un permiso específico
     */
    hasPermission(user: User, permission: string): boolean {
        const userPermissions = this.getUserPermissions(user);
        return userPermissions.includes(permission);
    }

    /**
     * Verifica si un usuario tiene alguno de los permisos especificados
     */
    hasAnyPermission(user: User, permissions: string[]): boolean {
        return permissions.some(permission => this.hasPermission(user, permission));
    }

    /**
     * Verifica si un usuario tiene todos los permisos especificados
     */
    hasAllPermissions(user: User, permissions: string[]): boolean {
        return permissions.every(permission => this.hasPermission(user, permission));
    }

    /**
     * Obtiene permisos agrupados por módulo para el frontend
     */
    getPermissionsByModule(user: User): Record<string, string[]> {
        const userPermissions = this.getUserPermissions(user);
        const modules = {};

        userPermissions.forEach(permission => {
            const [module, action] = permission.split('.');
            if (!modules[module]) {
                modules[module] = [];
            }
            modules[module].push(action);
        });

        return modules;
    }

    /**
     * Verifica si un usuario puede realizar una acción específica en un módulo
     */
    canPerformAction(user: User, module: string, action: string): boolean {
        return this.hasPermission(user, `${module}.${action}`);
    }
}
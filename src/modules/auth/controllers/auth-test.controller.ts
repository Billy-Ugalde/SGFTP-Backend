import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * CONTROLADOR SOLO PARA TESTING - ELIMINAR EN PRODUCCIÓN
 * Este controlador facilita las pruebas de activación de cuentas
 */
@Controller('auth/test')
export class AuthTestController {
    constructor(private dataSource: DataSource) {}

    /**
     * Ver estado completo de un usuario por email
     * GET /auth/test/user-status/:email
     */
    @Public()
    @Get('user-status/:email')
    async getUserStatus(@Param('email') email: string) {
        const user = await this.dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .leftJoinAndSelect('user.roles', 'roles')
            .addSelect('user.password')
            .addSelect('user.activation_token')
            .addSelect('user.activation_expires')
            .where('person.email = :email', { email })
            .getOne();

        if (!user) {
            return {
                found: false,
                message: 'Usuario no encontrado'
            };
        }

        return {
            found: true,
            user: {
                id: user.id_user,
                email: user.person.email,
                nombre: `${user.person.first_name} ${user.person.first_lastname}`,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                hasPassword: !!user.password,
                hasActivationToken: !!user.activation_token,
                activation_token: user.activation_token,
                activation_expires: user.activation_expires,
                tokenExpirado: user.activation_expires ? new Date() > new Date(user.activation_expires) : null,
                roles: user.roles?.map(r => r.name) || [],
                failedLoginAttempts: user.failedLoginAttempts
            }
        };
    }

    /**
     * Regenerar token de activación sin restricciones
     * POST /auth/test/regenerate-token
     * Body: { email: string }
     */
    @Public()
    @Post('regenerate-token')
    async regenerateToken(@Body() body: { email: string }) {
        const { email } = body;

        const user = await this.dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .where('person.email = :email', { email })
            .getOne();

        if (!user) {
            return {
                success: false,
                message: 'Usuario no encontrado'
            };
        }

        // Generar nuevo token
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72); // 72 horas

        await this.dataSource
            .getRepository(User)
            .update(user.id_user, {
                activation_token: token,
                activation_expires: expiresAt
            });

        return {
            success: true,
            message: 'Token regenerado exitosamente',
            data: {
                email: user.person.email,
                token: token,
                expires: expiresAt,
                activationLink: `${process.env.FRONTEND_URL}/activate?token=${token}`
            }
        };
    }

    /**
     * Resetear estado de activación de un usuario
     * POST /auth/test/reset-activation
     * Body: { email: string }
     */
    @Public()
    @Post('reset-activation')
    async resetActivation(@Body() body: { email: string }) {
        const { email } = body;

        const user = await this.dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .where('person.email = :email', { email })
            .getOne();

        if (!user) {
            return {
                success: false,
                message: 'Usuario no encontrado'
            };
        }

        // Generar nuevo token
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72); // 72 horas

        // Resetear estado a pendiente de activación
        await this.dataSource
            .getRepository(User)
            .update(user.id_user, {
                status: true,
                isEmailVerified: false,
                password: undefined,
                activation_token: token,
                activation_expires: expiresAt,
                failedLoginAttempts: 0
            });

        return {
            success: true,
            message: 'Estado de activación reseteado exitosamente',
            data: {
                email: user.person.email,
                token: token,
                expires: expiresAt,
                activationLink: `${process.env.FRONTEND_URL}/activate?token=${token}`,
                instructions: 'El usuario ahora está en estado pendiente de activación. Puedes usar el link para activar la cuenta.'
            }
        };
    }

    /**
     * Listar todos los usuarios con su estado
     * GET /auth/test/users
     */
    @Public()
    @Get('users')
    async listUsers() {
        const users = await this.dataSource
            .getRepository(User)
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .leftJoinAndSelect('user.roles', 'roles')
            .addSelect('user.password')
            .addSelect('user.activation_token')
            .addSelect('user.activation_expires')
            .getMany();

        return {
            total: users.length,
            users: users.map(user => ({
                id: user.id_user,
                email: user.person.email,
                nombre: `${user.person.first_name} ${user.person.first_lastname}`,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                hasPassword: !!user.password,
                hasActivationToken: !!user.activation_token,
                tokenExpirado: user.activation_expires ? new Date() > new Date(user.activation_expires) : null,
                roles: user.roles?.map(r => r.name) || []
            }))
        };
    }
}

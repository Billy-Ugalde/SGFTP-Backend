// src/auth/services/user-auth.service.ts - VERSIÓN MÍNIMA
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PasswordService } from './password.service';

@Injectable()
export class UserAuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private passwordService: PasswordService,
    ) {}

    /**
     * Busca usuario por email para login
     */
    async findByEmailForAuth(email: string): Promise<User | null> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .innerJoinAndSelect('user.role', 'role')
            .addSelect('user.password') // Incluir password para verificación
            .where('person.email = :email', { email })
            .andWhere('user.status = :status', { status: true }) // Solo usuarios activos
            .getOne();
    }

    /**
     * Valida credenciales básicas
     */
    async validateUserCredentials(email: string, password: string): Promise<User | null> {
        const user = await this.findByEmailForAuth(email);
        
        if (!user) {
            return null;
        }

        // Verificar contraseña
        const isPasswordValid = await this.passwordService.comparePassword(password, user.password);
        
        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    // ===== MÉTODOS AVANZADOS COMENTADOS (para después) =====
    
    /*
    // Estos métodos requieren primero migrar la BD con los campos nuevos
    
    async incrementFailedLoginAttempts(userId: number): Promise<void> {
        // Implementar después de migración
    }

    async generateEmailVerificationToken(userId: number): Promise<string> {
        // Implementar después de migración  
    }

    async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
        // Implementar después de migración
    }
    */
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { IUserAuthService } from '../interfaces/user-auth.interface';
import { UserRole } from '../../auth/enums/user-role.enum';
import { PasswordService } from '../../shared/services/password.service';

@Injectable()
export class UserAuthService implements IUserAuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
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
    // ===== MÉTODOS NUEVOS PARA GESTIÓN DE CUENTAS =====
    async findUserByPersonId(personId: number): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { person: { id_person: personId } },
            relations: ['person', 'role']
        });
    }

    async createUserWithRole(personId: number, role: UserRole, hashedPassword: string, queryRunner?: QueryRunner): Promise<User> {
        const manager = queryRunner?.manager || this.userRepository.manager;
        
        // Buscar rol
        const userRole = await manager.findOne(Role, { where: { name: role } });
        if (!userRole) {
            throw new NotFoundException(`Rol ${role} no encontrado`);
        }

        // Crear usuario
        const user = manager.create(User, {
            password: hashedPassword,
            status: true,
            isEmailVerified: false, // Requiere verificación
            failedLoginAttempts: 0,
            person: { id_person: personId },
            role: userRole,
        });

        return await manager.save(User, user);
    }

    async activateUserAccount(userId: number, queryRunner?: QueryRunner): Promise<void> {
        const manager = queryRunner?.manager || this.userRepository.manager;
        
        await manager.update(User, userId, {
            status: true,
            isEmailVerified: true, // Auto-verificar al aprobar
            failedLoginAttempts: 0, // Reset intentos fallidos
        });
    }

    async deactivateUserAccount(userId: number, reason: string, queryRunner?: QueryRunner): Promise<void> {
        const manager = queryRunner?.manager || this.userRepository.manager;
        
        await manager.update(User, userId, {
            status: false,
            // Nota: agregar campo 'deactivation_reason' si es necesario en el futuro
        });
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
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, MoreThan } from 'typeorm';
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

    // Método básico para encontrar usuario por ID
    async findOne(id: number): Promise<User | null> {
        return await this.userRepository.findOne({  
            where: { id_user: id },
            relations: ['person', 'roles']
        });
    }

    /**
     * Busca usuario por email para login
     */
    async findByEmailForAuth(email: string): Promise<User | null> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .leftJoinAndSelect('user.roles', 'roles')  
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

        if (!user.password) {
            return null; // Usuario sin contraseña (pendiente de activación)
        }
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
            relations: ['person', 'roles']
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
            roles: [userRole],      
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

    async findUserByActivationToken(token: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: {
            activation_token: token,
            activation_expires: MoreThan(new Date())
            },
            relations: ['person', 'roles']
        });
    }

    async findUserByActivationTokenWithDetails(token: string): Promise<{user: User | null, tokenExists: boolean}> {
        // Primero verificar si existe usuario activo con ese token
        const activeUser = await this.userRepository.findOne({
            where: {
            activation_token: token,
            activation_expires: MoreThan(new Date())
            },
            relations: ['person', 'roles']
        });

        if (activeUser) {
            return { user: activeUser, tokenExists: true };
        }

        // Verificar si el token existe pero está expirado
        const expiredUser = await this.userRepository.findOne({
            where: { activation_token: token },
            relations: ['person', 'roles']
        });

        return { 
            user: null, 
            tokenExists: !!expiredUser 
        };
    }

    async activateUserWithPassword(userId: number, newPassword: string): Promise<void> {
        // AGREGAR: Verificar estado actual antes de activar
        const currentUser = await this.userRepository.findOne({
            where: { id_user: userId },
            select: ['id_user', 'status', 'isEmailVerified', 'password', 'activation_token']
        });

        if (!currentUser) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // CRÍTICO: Prevenir activación de cuenta ya activa
        if (currentUser.isEmailVerified && currentUser.status && currentUser.password) {
            throw new ForbiddenException('Esta cuenta ya está activa');
        }

        // CRÍTICO: Verificar que el token aún sea válido
        if (!currentUser.activation_token) {
            throw new ForbiddenException('Token de activación ya utilizado');
        }

        const hashedPassword = await this.passwordService.hashPassword(newPassword);
        
        await this.userRepository.update(userId, {
            password: hashedPassword,
            status: true,
            isEmailVerified: true,
            activation_token: undefined,        // ← CRÍTICO: Limpiar token
            activation_expires: undefined     // ← CRÍTICO: Limpiar expiración
        });
    }

    async findUserWithPasswordById(userId: number): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { id_user: userId },
            relations: ['person'],
            select: {
                id_user: true,
                password: true, // ← Incluir password para verificación
                person: {
                    id_person: true,
                    email: true,
                    first_name: true
                }
            }
        });
    }

    async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
        await this.userRepository.update(userId, { 
            password: hashedPassword 
        });
    }

    async findByEmailForReset(email: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { 
            person: { email },
            status: true // Solo usuarios activos pueden resetear
            },
            relations: ['person']
        });
    }

    async setResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
        await this.userRepository.update(userId, {
            reset_token: token,
            reset_expires: expiresAt
        });
    }

    async findUserByResetToken(token: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: {
            reset_token: token,
            reset_expires: MoreThan(new Date()) // Token no expirado
            },
            relations: ['person']
        });
    }

    async resetPasswordWithToken(userId: number, hashedPassword: string): Promise<void> {
        await this.userRepository.update(userId, {
            password: hashedPassword,
            reset_token: undefined, // Limpiar token usado
            reset_expires: undefined,
            failedLoginAttempts: 0 // Reset intentos fallidos
        });
    }
}
// src/modules/users/interfaces/user-auth.interface.ts
import { User } from '../entities/user.entity';
import { UserRole } from '../../auth/enums/user-role.enum';
import { QueryRunner } from 'typeorm';

export interface IUserAuthService {
    // ===== MÉTODOS EXISTENTES =====
    findByEmailForAuth(email: string): Promise<User | null>;
    validateUserCredentials(email: string, password: string): Promise<User | null>;
    
    // ===== MÉTODOS NUEVOS PARA GESTIÓN DE CUENTAS =====
    findUserByPersonId(personId: number): Promise<User | null>;
    createUserWithRole(personId: number, role: UserRole, hashedPassword: string, queryRunner?: QueryRunner): Promise<User>;
    activateUserAccount(userId: number, queryRunner?: QueryRunner): Promise<void>;
    deactivateUserAccount(userId: number, reason: string, queryRunner?: QueryRunner): Promise<void>;
    
    // ===== MÉTODOS FUTUROS (COMENTADOS POR AHORA) =====
    // incrementFailedLoginAttempts(userId: number): Promise<void>;
    // resetFailedLoginAttempts(userId: number): Promise<void>;
    // generateEmailVerificationToken(userId: number): Promise<string>;
}
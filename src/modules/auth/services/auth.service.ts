import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtTokenService } from './jwt.service';
import { User } from '../../users/entities/user.entity';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { DataSource, QueryRunner } from 'typeorm';
import { Person } from '../../../entities/person.entity';
import { PasswordService } from '../../shared/services/password.service';
import { IUserAuthService } from '../../users/interfaces/user-auth.interface';
import { UserAuthService } from '../../users/services/user-auth.service'; // ← Importación temporal
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class AuthService {
    constructor(
        private userAuthService: UserAuthService,
        private jwtTokenService: JwtTokenService,
        private passwordService: PasswordService,
        private dataSource: DataSource,
    ) {}

    /**
     * LOGIN básico - funcional
     */
    async login(email: string, password: string): Promise<AuthResponseDto> {
        // 1. Validar credenciales
        const user = await this.userAuthService.validateUserCredentials(email, password);
        
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // 2. Generar tokens
        const jwtPayload = user.toJwtPayload();
        const accessToken = this.jwtTokenService.generateAccessToken(user);
        const refreshToken = this.jwtTokenService.generateRefreshToken(user);

        // 3. Preparar respuesta
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id_user,
                email: user.person.email,
                firstName: user.person.first_name,
                firstLastname: user.person.first_lastname,
                role: user.role.name,
                isEmailVerified: user.isEmailVerified,
            }
        };
    }

    /**
     * VERIFY TOKEN - para guards
     */
    async validateAccessToken(token: string): Promise<User | null> {
        try {
            const payload = await this.jwtTokenService.verifyAccessToken(token);
            const userId = parseInt(payload.sub);
            
            // Buscar usuario completo
            const user = await this.userAuthService.findByEmailForAuth(payload.email);
            
            return user && user.id_user === userId ? user : null;
        } catch (error) {
            return null;
        }
    }

    async register(registerDto: RegisterDto): Promise<{ message: string; userId: number }> {
        // 1. Verificar email único
        const existingUser = await this.userAuthService.findByEmailForAuth(registerDto.email);
        
        if (existingUser) {
            throw new ConflictException('Ya existe un usuario con este email');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 2. Crear Person
            const person = queryRunner.manager.create(Person, {
                first_name: registerDto.first_name,
                second_name: registerDto.second_name || '',
                first_lastname: registerDto.first_lastname,
                second_lastname: registerDto.second_lastname || '',
                email: registerDto.email,
            });

            const savedPerson = await queryRunner.manager.save(Person, person);

            // 3. Hash password
            const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

            // 4. Crear User usando UserAuthService
            const savedUser = await this.userAuthService.createUserWithRole(
                savedPerson.id_person,
                UserRole.VOLUNTEER,
                hashedPassword,
                queryRunner
            );

            await queryRunner.commitTransaction();

            return {
                message: 'Usuario registrado exitosamente',
                userId: savedUser.id_user
            };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createAccountForApprovedEntrepreneur(personId: number, queryRunner?: QueryRunner): Promise<void> {
        const existingUser = await this.userAuthService.findUserByPersonId(personId);
        
        if (existingUser) {
            // Usuario existe - solo activar
            await this.userAuthService.activateUserAccount(existingUser.id_user, queryRunner);
        } else {
            // Usuario no existe - crear nuevo
            const tempPassword = this.passwordService.generateTemporaryPassword();
            const hashedPassword = await this.passwordService.hashPassword(tempPassword);
            
            await this.userAuthService.createUserWithRole(
                personId,
                UserRole.ENTREPRENEUR,
                hashedPassword,
                queryRunner
            );

            // TODO: Enviar email con credenciales temporales
            // await this.emailService.sendTemporaryCredentials(email, tempPassword);
        }
    }
}
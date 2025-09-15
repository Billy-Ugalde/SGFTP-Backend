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

    // Método privado para configuración de cookies
    private getCookieOptions(isRefreshToken = false) {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieConfig = {
            httpOnly: true,                    // Previene acceso desde JavaScript
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as 'strict' | 'lax' | 'none',
            domain: process.env.COOKIE_DOMAIN || 'localhost',
            path: '/',
        };

        return {
            ...cookieConfig,
            maxAge: isRefreshToken 
            ? 7 * 24 * 60 * 60 * 1000    // 7 días para refresh token
            : 15 * 60 * 1000,            // 15 minutos para access token
        };
    }

    /**
     * LOGIN con cookies seguras
     */
    async loginWithCookies(email: string, password: string, response: any): Promise<Omit<AuthResponseDto, 'accessToken' | 'refreshToken'>> {
    const user = await this.userAuthService.validateUserCredentials(email, password);
    
    if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = this.jwtTokenService.generateAccessToken(user);
    const refreshToken = this.jwtTokenService.generateRefreshToken(user);

    response.cookie('accessToken', accessToken, this.getCookieOptions(false));
    response.cookie('refreshToken', refreshToken, this.getCookieOptions(true));

    return {
        user: {
            id: user.id_user,
            email: user.person.email,
            firstName: user.person.first_name,
            firstLastname: user.person.first_lastname,
            roles: user.getAllRoleNames(), // ✅ CAMBIO: Array de roles
            primaryRole: user.primaryRole.name, // ✅ CAMBIO: Rol principal
            isEmailVerified: user.isEmailVerified,
        }
    };
}

    /**
     * REFRESH TOKEN desde cookies
     */
    async refreshTokenFromCookie(request: any, response: any): Promise<{ message: string }> {
        const refreshToken = request.cookies?.refreshToken;
        
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token no encontrado');
        }

        try {
            const payload = await this.jwtTokenService.verifyRefreshToken(refreshToken);
            const user = await this.userAuthService.findByEmailForAuth(payload.email);
            
            if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
            }

            const newAccessToken = this.jwtTokenService.generateAccessToken(user);
            response.cookie('accessToken', newAccessToken, this.getCookieOptions(false));
            
            return { message: 'Token renovado exitosamente' };
            
        } catch (error) {
            response.clearCookie('accessToken');
            response.clearCookie('refreshToken');
            throw new UnauthorizedException('Refresh token inválido');
        }
    }

    /**
     * LOGOUT - limpiar cookies
     */
    async logout(response: any): Promise<{ message: string }> {
        response.clearCookie('accessToken');
        response.clearCookie('refreshToken');
    
        return { message: 'Sesión cerrada exitosamente' };
    }

    /**
     * Validar token desde cookies O headers (DUAL)
     */
    async validateTokenFromRequest(request: any): Promise<User | null> {
        // Intentar obtener token de cookies primero (más seguro)
        let token = request.cookies?.accessToken;
        
        // Si no hay cookie, intentar desde Authorization header
        if (!token) {
            const authHeader = request.headers.authorization;
            token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        }

        // Si no hay token en ningún lugar
        if (!token) {
            return null;
        }

        // Usar método de validación existente
        return await this.validateAccessToken(token);
    }
}
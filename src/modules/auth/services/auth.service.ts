import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtTokenService } from './jwt.service';
import { User } from '../../users/entities/user.entity';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { DataSource, QueryRunner, MoreThan } from 'typeorm';
import { Person } from '../../../entities/person.entity';
import { PasswordService } from '../../shared/services/password.service';
import { UserAuthService } from '../../users/services/user-auth.service'; 
import { UserRole } from '../enums/user-role.enum';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private userAuthService: UserAuthService,
        private jwtTokenService: JwtTokenService,
        private passwordService: PasswordService,
        private dataSource: DataSource,
    ) {}


    //VERIFY TOKEN - para guards
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

    //REGISTER - transacción completa
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

    //LOGIN con cookies seguras
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
            roles: user.getAllRoleNames(), 
            isEmailVerified: user.isEmailVerified,
        }
    };
}

    //REFRESH TOKEN desde cookies
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

    //LOGOUT - limpiar cookies
    async logout(response: any): Promise<{ message: string }> {
        response.clearCookie('accessToken');
        response.clearCookie('refreshToken');
    
        return { message: 'Sesión cerrada exitosamente' };
    }

    //Validar token desde cookies O headers (DUAL) 
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

    async activateUserAccount(token: string, newPassword: string): Promise<{ message: string }> {
        // 1. Buscar usuario por token con detalles de expiración
        const { user, tokenExists } = await this.userAuthService.findUserByActivationTokenWithDetails(token);
        
        if(user){
            if (user.isEmailVerified && user.status && user.password) {
                throw new ForbiddenException('Esta cuenta ya ha sido activada previamente');
            }
            if (!user.activation_token || !user.activation_expires) {
                throw new ForbiddenException('El enlace de activación ya no es válido');
            }
        }

        if (!user) {
            
            if (tokenExists) {
            throw new NotFoundException('El enlace de activación ha expirado');
            } else {
            throw new NotFoundException('El enlace de activación no es válido');
            }
        }

        // 2. Validar fortaleza de contraseña
        const validation = this.passwordService.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            throw new ConflictException(`La contraseña no cumple con los requisitos: ${validation.errors.join(', ')}`);
        }

        // 3. Activar cuenta usando UserAuthService
        await this.userAuthService.activateUserWithPassword(user.id_user, newPassword);

        return { message: 'Cuenta activada exitosamente' };
    }

    //CAMBIO DE CONTRASEÑA - Usuario autenticado
    async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ 
        message: string; 
        userEmail: string; 
        userName: string 
    }> {
        const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
        
        // 1. Validación cruzada de contraseñas (doble verificación)
        if (newPassword !== confirmPassword) {
            throw new ConflictException('Las contraseñas no coinciden');
        }
        
        // 2. Buscar usuario completo con contraseña
        const user = await this.userAuthService.findUserWithPasswordById(userId);
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        
        // 3. VALIDAR QUE EL USUARIO TENGA CONTRASEÑA (no esté pendiente de activación)
        if (!user.password) {
            throw new ConflictException('No puedes cambiar la contraseña de una cuenta pendiente de activación');
        }
        
        // 4. Verificar contraseña actual - AHORA ES SEGURO
        const isCurrentPasswordValid = await this.passwordService.comparePassword(
            currentPassword, 
            user.password // ← Ya validamos que no es undefined
        );
        
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('La contraseña actual es incorrecta');
        }
        
        // 5. Verificar que la nueva contraseña sea diferente - AHORA ES SEGURO
        const isSamePassword = await this.passwordService.comparePassword(
            newPassword, 
            user.password // ← Ya validamos que no es undefined
        );
        
        if (isSamePassword) {
            throw new ConflictException('La nueva contraseña debe ser diferente a la actual');
        }
        
        // 6. Validar fortaleza de nueva contraseña
        const validation = this.passwordService.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            throw new ConflictException(`La contraseña no cumple con los requisitos: ${validation.errors.join(', ')}`);
        }
        
        // 7. Actualizar contraseña
        const hashedNewPassword = await this.passwordService.hashPassword(newPassword);
        await this.userAuthService.updateUserPassword(userId, hashedNewPassword);
        
        // 8. Retornar datos para que el controlador maneje el email
        return { 
            message: 'Contraseña cambiada exitosamente. Por seguridad, debes volver a iniciar sesión.',
            userEmail: user.person.email,
            userName: user.person.first_name
        };
    }

    //SOLICITAR RESET DE CONTRASEÑA - Envía email con token
    async requestPasswordReset(email: string): Promise<{ 
        message: string; 
        userEmail?: string; 
        userName?: string; 
        resetToken?: string 
    }> {
        // 1. Buscar usuario por email (solo usuarios activos)
        const user = await this.userAuthService.findByEmailForReset(email);
        
        // IMPORTANTE: Siempre retornar éxito (no revelar si email existe)
        const successMessage = 'Si el email existe en nuestro sistema, recibirás las instrucciones para restablecer tu contraseña.';
        
        if (!user) {
            // Email no existe - retornar éxito pero no hacer nada (seguridad)
            return { message: successMessage };
        }
        
        // 2. Generar token criptográficamente seguro
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        
        // 3. Calcular expiración (15 minutos)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        
        // 4. Guardar token en BD
        await this.userAuthService.setResetToken(user.id_user, resetToken, expiresAt);
        
        return { 
            message: successMessage,
            // Datos para el controlador (manejo de email)
            userEmail: user.person.email,
            userName: user.person.first_name,
            resetToken: resetToken
        };
    }

    //VALIDAR TOKEN DE RESET - Solo verificar si es válido (sin procesar)
    async validatePasswordResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
        try {
            // Buscar usuario por token (reutilizando lógica existente)
            const user = await this.userAuthService.findUserByResetToken(token);
            
            if (!user) {
                return { 
                    valid: false, 
                    message: 'El enlace de restablecimiento es inválido o ha expirado' 
                };
            }
            
            return { valid: true };
            
        } catch (error) {
            return { 
                valid: false, 
                message: 'Error al validar el enlace de restablecimiento' 
            };
        }
    }

    //RESETEAR CONTRASEÑA - Usar token para cambiar contraseña
    async resetPasswordWithToken(resetPasswordDto: ResetPasswordDto): Promise<{ 
        message: string; 
        userEmail?: string; 
        userName?: string 
    }> {   
    const { token, newPassword, confirmPassword } = resetPasswordDto;
        
        // 1. Validación cruzada de contraseñas
        if (newPassword !== confirmPassword) {
            throw new ConflictException('Las contraseñas no coinciden');
        }
        
        // 2. Buscar usuario por token válido
        const user = await this.userAuthService.findUserByResetToken(token);
        
        if (!user) {
            throw new NotFoundException('El enlace de restablecimiento es inválido o ha expirado');
        }
        
        // 3. Validar fortaleza de nueva contraseña
        const validation = this.passwordService.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            throw new ConflictException(`La contraseña no cumple con los requisitos: ${validation.errors.join(', ')}`);
        }
        
        // 4. Hashear nueva contraseña
        const hashedPassword = await this.passwordService.hashPassword(newPassword);
        
        // 5. Actualizar contraseña y limpiar token
        await this.userAuthService.resetPasswordWithToken(user.id_user, hashedPassword);
        
        return { 
            message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
            userEmail: user.person.email,
            userName: user.person.first_name
        };
    }
}
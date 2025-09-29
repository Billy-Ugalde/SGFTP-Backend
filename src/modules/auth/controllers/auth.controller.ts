import { Controller, Post, Body, Get, UseGuards, Res, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { AuthGuard } from '../guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { User } from '../../users/entities/user.entity';
import { Roles } from '../decorators/roles.decorator';
import { RoleGuard } from '../guards/role.guard';
import { UserRole } from '../enums/user-role.enum';
import { RateLimit } from '../decorators/rate-limit.decorator';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { Response, Request } from 'express';
import { PermissionService } from '../services/permission.service';
import { AuthEmailService } from '../services/auth-email.service';
import { ActivateAccountDto } from '../dto/activate-account.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
    constructor(
        private authService: AuthService,  
        private permissionService: PermissionService,
        private authEmailService: AuthEmailService,
    ) {}

    @Public()
    @UseGuards(RateLimitGuard)
    @RateLimit(5, 15 * 60 * 1000) 
    @Post('register')
    async register(@Body() registerDto: RegisterDto): Promise<{ message: string; userId: number }> {
        return await this.authService.register(registerDto);
    }

    @Public()
    @UseGuards(RateLimitGuard)
    @RateLimit(5, 15 * 60 * 1000) 
    @Post('login')
    async loginWithCookies(
    @Body() loginDto: LoginDto, 
    @Res({ passthrough: true }) response: Response
    ): Promise<Omit<AuthResponseDto, 'accessToken' | 'refreshToken'>> {
        return await this.authService.loginWithCookies(loginDto.email, loginDto.password, response);
    }

    @Public()
    @Post('refresh')
    async refreshToken(
    @Req() request: Request, 
    @Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
        return await this.authService.refreshTokenFromCookie(request, response);
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
        return await this.authService.logout(response);
    }

    @Get('profile')
    async getProfile(@CurrentUser() user: User) {
        return {
            message: `Hola ${user.person.first_name}`,
            user: {
                id: user.id_user,
                firstName: user.person.first_name,
                email: user.person.email,
                roles: user.getAllRoleNames(),
            }
        };
    }

    @Get('verify-token')
    async verifyToken(@CurrentUser() user: User) {
        return { 
            valid: true, 
            user: user.toJwtPayload() 
        };
    }

    // Solo super admins
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @Get('admin/system-info')
    async getSystemInfo(@CurrentUser() user: User) {
        return {
            message: 'Información del sistema',
            accessedBy: user.person.first_name,
            roles: user.getAllRoleNames(),
        };
    }

    // Múltiples roles permitidos
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
    @Get('admin/dashboard')
    async getAdminDashboard(@CurrentUser() user: User) {
        return {
            message: 'Dashboard administrativo',
            userRoles: user.getAllRoleNames(),
            permissions: this.getPermissionsByRoles(user.getAllRoleNames()) // ← Método actualizado
        };
    }

    // Solo emprendedores
    @UseGuards(RoleGuard)
    @Roles(UserRole.ENTREPRENEUR)
    @Get('entrepreneur/profile')
    async getEntrepreneurProfile(@CurrentUser() user: User) {
        return {
            message: 'Perfil de emprendedor',
            user: user.person.first_name
        };
    }

    private getPermissionsByRoles(roleNames: string[]): string[] {
        const allPermissions = new Set<string>();
        
        const permissions = {
            [UserRole.SUPER_ADMIN]: ['all'],
            [UserRole.GENERAL_ADMIN]: ['users', 'reports', 'settings'],
            [UserRole.FAIR_ADMIN]: ['fairs', 'entrepreneurs', 'events'],
            [UserRole.CONTENT_ADMIN]: ['content', 'news', 'pages'],
            [UserRole.AUDITOR]: ['view_reports', 'view_logs'],
            [UserRole.ENTREPRENEUR]: ['own_profile', 'apply_events'],
            [UserRole.VOLUNTEER]: ['register_activities', 'view_events']
        };

        roleNames.forEach(roleName => {
            const rolePermissions = permissions[roleName] || [];
            rolePermissions.forEach(permission => allPermissions.add(permission));
        });

        return Array.from(allPermissions);
    }

    // En auth.controller.ts - SOLO PARA TESTING
    @Post('test-email')
    async testActivationEmail(@Body() testData?: { email?: string }) {
        const testEmail = testData?.email || 'tu-email@gmail.com'; // ← Cambiar por tu email
        
        try {
            await this.authEmailService.sendAccountActivationEmail(
            testEmail,
            'Usuario Prueba',
            'TempPass123!',
            ['entrepreneur', 'volunteer']
            );
            
            return { 
            success: true,
            message: 'Email de activación enviado exitosamente',
            sentTo: testEmail
            };
        } catch (error) {
            return {
            success: false,
            message: 'Error enviando email',
            error: error.message
            };
        }
    }

    @Public()
    @Post('activate')
    async activateAccount(@Body() activateDto: ActivateAccountDto): Promise<{ message: string }> {
        return await this.authService.activateUserAccount(activateDto.token, activateDto.password);
    }

    @UseGuards(RateLimitGuard)
    @RateLimit(5, 15 * 60 * 1000) // 5 intentos por 15 minutos
    @Post('change-password')
    async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response
    ): Promise<{ message: string }> {
        // 1. Cambiar contraseña (AuthService)
        const result = await this.authService.changePassword(user.id_user, changePasswordDto);
        
        // 2. Enviar notificación (AuthEmailService - responsabilidad del controlador)
        try {
            await this.authEmailService.sendPasswordChangeNotification(
            result.userEmail,
            result.userName
            );
        } catch (emailError) {
            console.warn('Error enviando notificación de cambio de contraseña:', emailError.message);
        }
        
        // 3. Limpiar cookies para forzar re-login por seguridad
        response.clearCookie('accessToken');
        response.clearCookie('refreshToken');
        
        return { message: result.message };
    }

    @Public()
    @UseGuards(RateLimitGuard)
    @RateLimit(3, 60 * 60 * 1000) // 3 intentos por hora por IP
    @Post('forgot-password')
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
        // 1. Solicitar reset (AuthService)
        const result = await this.authService.requestPasswordReset(forgotPasswordDto.email);
        
        // 2. Enviar email si hay datos de usuario (AuthEmailService)
        if (result.userEmail && result.userName && result.resetToken) {
            try {
            await this.authEmailService.sendPasswordResetEmail(
                result.userEmail,
                result.userName,
                result.resetToken
            );
            } catch (emailError) {
            console.warn('Error enviando email de reset:', emailError.message);
            }
        }
        
        return { message: result.message };
    }

    @Public()
    @UseGuards(RateLimitGuard)
    @RateLimit(5, 15 * 60 * 1000) // 5 intentos por 15 minutos
    @Post('reset-password')
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
        // 1. Resetear contraseña (AuthService)
        const result = await this.authService.resetPasswordWithToken(resetPasswordDto);
        
        // 2. Enviar notificación de éxito (AuthEmailService)
        if (result.userEmail && result.userName) {
            try {
            await this.authEmailService.sendPasswordChangeNotification(
                result.userEmail,
                result.userName
            );
            } catch (emailError) {
            console.warn('Error enviando notificación de reset exitoso:', emailError.message);
            }
        }
        
        return { message: result.message };
    }
}
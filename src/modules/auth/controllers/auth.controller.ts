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

@Controller('auth')
@UseGuards(AuthGuard)
export class AuthController {
    constructor(
        private authService: AuthService,  // ← USA EL PRINCIPAL
    ) {}

    @Public()
    @UseGuards(RateLimitGuard)
    @RateLimit(5, 15 * 60 * 1000) 
    @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return await this.authService.login(loginDto.email, loginDto.password);
    }

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
    @Post('login-cookies')
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
                email: user.person.email,
                role: user.role.name,
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
            role: user.role.name
        };
    }

    // Múltiples roles permitidos
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
    @Get('admin/dashboard')
    async getAdminDashboard(@CurrentUser() user: User) {
        return {
            message: 'Dashboard administrativo',
            userRole: user.role.name,
            permissions: this.getPermissionsByRole(user.role.name)
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

    private getPermissionsByRole(role: string): string[] {
        const permissions = {
            [UserRole.SUPER_ADMIN]: ['all'],
            [UserRole.GENERAL_ADMIN]: ['users', 'reports', 'settings'],
            [UserRole.FAIR_ADMIN]: ['fairs', 'entrepreneurs', 'events'],
            [UserRole.CONTENT_ADMIN]: ['content', 'news', 'pages'],
            [UserRole.AUDITOR]: ['view_reports', 'view_logs'],
            [UserRole.ENTREPRENEUR]: ['own_profile', 'apply_events'],
            [UserRole.VOLUNTEER]: ['register_activities', 'view_events']
        };
        return permissions[role] || [];
    }

}
import { Controller } from "@nestjs/common";
import { Post, Body } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,  // ← USA EL PRINCIPAL
    ) {}

     @Post('login')
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
        return await this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('register')
    async register(@Body() registerDto: RegisterDto): Promise<{ message: string; userId: number }> {
        return await this.authService.register(registerDto);
    }

}
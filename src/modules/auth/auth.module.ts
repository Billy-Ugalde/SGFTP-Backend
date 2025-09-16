import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt.service';
import { UserModule} from '../users/user.module';
import { SharedModule } from '../shared/shared.module';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { PermissionService } from './services/permission.service'; 
import { GmailEmailProvider } from '../shared/providers/gmail-email.provider';
import { AuthEmailService } from './services/auth-email.service';

@Module({
  imports: [
    UserModule,
    SharedModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtTokenService,
    AuthGuard,
    RoleGuard,
    PermissionService,
    GmailEmailProvider,
    AuthEmailService,
  ],
  controllers: [AuthController],
  exports: [
    AuthService, 
    JwtTokenService, 
    AuthGuard,
    RoleGuard,
    PermissionService,
    AuthEmailService,
  ],
})
export class AuthModule {}
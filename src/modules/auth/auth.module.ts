import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt.service';
import { UserModule} from '../users/user.module'; // ← Importar Users module
import { SharedModule } from '../shared/shared.module'; // ← Importar shared
import { AuthGuard } from './guards/auth.guard';
import { Role } from '../users/entities/role.entity';
import { RoleGuard } from './guards/role.guard';

@Module({
  imports: [
    UserModule,
    SharedModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
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
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtTokenService, AuthGuard,RoleGuard,],
})
export class AuthModule {}
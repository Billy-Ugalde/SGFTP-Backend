import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt.service';
import { UserModule} from '../users/user.module'; // ← Importar Users module
import { SharedModule } from '../shared/shared.module'; // ← Importar shared

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
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtTokenService],
})
export class AuthModule {}
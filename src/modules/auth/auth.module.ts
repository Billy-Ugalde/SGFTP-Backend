import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UserAuthService } from './services/user-auth.service';
import { JwtTokenService } from './services/jwt.service';
import { PasswordService } from './services/password.service';
import { AuthService } from './services/auth.service'; 
import { AuthController } from './controllers/auth.controller'; 
import { Person } from '../../entities/person.entity';
import { Role } from '../users/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Person, Role]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '30m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    UserAuthService,
    JwtTokenService,
    PasswordService,
    AuthService,     
  ],
  controllers: [
    AuthController,   
  ],
  exports: [
    AuthService,     
    JwtTokenService,
  ],
})
export class AuthModule {}
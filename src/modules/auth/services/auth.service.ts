import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { JwtTokenService } from './jwt.service';
import { User } from '../../users/entities/user.entity';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { DataSource } from 'typeorm';
import { Person }  from '../../../entities/person.entity';
import { Role } from '../../users/entities/role.entity';
import { PasswordService } from './password.service';

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
                second_lastname: registerDto.second_lastname || '', // ← Person.entity requiere string, no null
                email: registerDto.email,
            });

            const savedPerson = await queryRunner.manager.save(Person, person);

            // 3. Buscar rol voluntario
            const voluntarioRole = await queryRunner.manager.findOne(Role, {
                where: { name: 'voluntario' }
            });

            if (!voluntarioRole) {
                throw new Error('Rol de voluntario no encontrado en la base de datos');
            }

            // 4. Hash password
            const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

            // 5. Crear User
            const user = queryRunner.manager.create(User, {
                password: hashedPassword,
                status: true,
                person: savedPerson, // ← Usar la instancia guardada
                role: voluntarioRole, // ← Usar la instancia encontrada
            });
            const savedUser = await queryRunner.manager.save(user);

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
}
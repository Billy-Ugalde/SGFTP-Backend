import { ConflictException, Injectable, NotFoundException, Inject } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository, In  } from "typeorm";
import { Role } from "../entities/role.entity";
import { CreateUserDto } from "../dto/user.dto";
import { Person } from "src/entities/person.entity";
import { UpdateUserDto } from "../dto/userUpdateDto";
import { PasswordService } from "src/modules/shared/services/password.service";
import { CreateCompleteInvitationDto } from "../dto/complete-invitation.dto";
import { Phone } from "src/entities/phone.entity";
import { DataSource } from "typeorm";   
import { AuthEmailService } from "src/modules/auth/services/auth-email.service";    
import { AccountInvitationService } from 'src/modules/auth/services/account-invitation.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Person)
        private personRepository: Repository<Person>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        private passwordService: PasswordService,
        private dataSource: DataSource,
        private authEmailService: AuthEmailService,  
        private accountInvitationService: AccountInvitationService,
    ) { }
    async create(createUserDto: CreateUserDto) {
        const person = await this.personRepository.findOne({
            where: { id_person: createUserDto.id_person },
            relations: ['user']
        });

        if (!person) {
            throw new NotFoundException('La persona especificada no existe');
        }

        if (person.user) {
            throw new ConflictException('Esta persona ya tiene un usuario asociado');
        }

        const hashedPassword = await this.passwordService.hashPassword(createUserDto.password);
        const role = await this.roleRepository.findOne({
            where: { id_role: createUserDto.id_role }
        });

        if (!role) {
            throw new NotFoundException('El rol especificado no existe');
        }

        if (role.name === 'super_admin') {
            throw new ConflictException('No se pueden crear usuarios SUPER_ADMIN mediante API');
        }

        const user = this.userRepository.create({
            password: hashedPassword,
            status: createUserDto.status ?? true,
            person: { id_person: createUserDto.id_person } as Person,
            roles: [role],        
            isEmailVerified: false,
            failedLoginAttempts: 0,
        });

        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({ 
            relations: ['roles', 'person'], 
            order: { createdAt: 'DESC' }
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const user = await this.findOne(id);

        if (updateUserDto.password) {
            const validation = this.passwordService.validatePasswordStrength(updateUserDto.password);
            if (!validation.isValid) {
                throw new ConflictException(`La contraseña no cumple con los requisitos: ${validation.errors.join(', ')}`);
            }
            updateUserDto.password = await this.passwordService.hashPassword(updateUserDto.password);
        }

        // SIMPLIFICADO: Solo actualizar datos básicos
        await this.userRepository.update(id, updateUserDto);
        return this.findOne(id);
    }

    async updateStatus(id_user: number, updateStatus: UpdateUserDto) {
        const user = await this.userRepository.findOne({ where: { id_user } });

        if (!user) {
            throw (`El usuario con el id ${id_user} no fue encontrado`);
        }
        await this.userRepository.update(id_user, updateStatus);
        return this.findOne(id_user);
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id_user: id },
            relations: ['roles', 'person'], 
        });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    // Encontrar usuario por email (para auth y admin dashboard)
    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .leftJoinAndSelect('user.roles', 'roles')           
            .where('person.email = :email', { email })
            .getOne();
    }

    
    //Listar usuarios por rol (para admin)
    async findByRole(roleName: string): Promise<User[]> {
    return await this.userRepository
        .createQueryBuilder('user')
        .innerJoinAndSelect('user.person', 'person')
        .innerJoinAndSelect('user.roles', 'roles')      
        .where('roles.name = :roleName', { roleName })
        .orderBy('user.createdAt', 'DESC')
        .getMany();
    }

    //Suspender usuario
    async suspendUser(userId: number, reason?: string): Promise<User> {
        await this.userRepository.update(userId, {
            status: false,
            // Podrías agregar campos suspendedAt, suspendedReason
        });

        return this.findOne(userId);
    }

    //Reactivar usuario
    async reactivateUser(userId: number): Promise<User> {
        await this.userRepository.update(userId, {
            status: true,
            // Podrías limpiar campos suspendedAt, suspendedReason
        });
        return this.findOne(userId);
    }

    // Lógica de permisos para cambiar roles
    async changeUserRole(userId: number, newRoleId: number, changedBy: number): Promise<User> {
        const user = await this.findOne(userId);
        const newRole = await this.roleRepository.findOne({ where: { id_role: newRoleId } });

        if (!newRole) {
            throw new NotFoundException('Rol no encontrado');
        }

        const admin = await this.findOne(changedBy);
        if (!this.canAssignRole(this.getHighestRole(admin.roles), newRole.name)) {
            throw new ConflictException('No tienes permisos para asignar este rol');
        }

        if (!user.hasRole(newRole.name)) {
            user.roles.push(newRole);
        } else {
            throw new ConflictException('El usuario ya tiene este rol asignado');
        }

        await this.userRepository.save(user);
        return this.findOne(userId);
    }

    
    //Obtener estadísticas de usuarios para dashboard
    async getUserStats(): Promise<{
        total: number;
        byRole: Record<string, number>;
        pendingApproval: number;
        recentRegistrations: number;
    }> {
        const [total, byRole, pendingApproval, recent] = await Promise.all([
            this.userRepository.count(),
            this.userRepository
                .createQueryBuilder('user')
                .innerJoin('user.roles', 'role')   
                .select('role.name', 'role')
                .addSelect('COUNT(*)', 'count')
                .groupBy('role.name')
                .getRawMany(),
            this.userRepository.count({ 
                where: { status: false },
            }),
            this.userRepository.count({
                where: {
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Última semana
                }
            })
        ]);

        const roleStats = byRole.reduce((acc, item) => {
            acc[item.role] = parseInt(item.count);
            return acc;
        }, {});

        return {
            total,
            byRole: roleStats,
            pendingApproval,
            recentRegistrations: recent
        };
    }

    //Soft delete (mejor que delete permanente)    
    async softDelete(id: number): Promise<void> {
        const user = await this.findOne(id);
        
        // Marcar como inactivo en lugar de eliminar
        await this.userRepository.update(id, {
            status: false,
            // Podrías agregar deletedAt: new Date()
        });
    }

    // Validación de jerarquía de roles
    private canAssignRole(adminRole: string, targetRole: string): boolean {
        const roleHierarchy = {
            'super_admin': ['general_admin', 'fair_admin', 'content_admin', 'auditor', 'entrepreneur', 'volunteer'],
            'general_admin': ['fair_admin', 'content_admin', 'auditor', 'entrepreneur', 'volunteer'],
            'fair_admin': ['entrepreneur', 'volunteer'],
            'content_admin': ['entrepreneur', 'volunteer'],
            'auditor': [] // Solo lectura
        };

        return roleHierarchy[adminRole]?.includes(targetRole) || false;
    }

    // Validación crítica de seguridad
    private async validateRoleAssignment(adminUserId: number, targetRoleId: number): Promise<void> {
        const admin = await this.findOne(adminUserId);
        const targetRole = await this.roleRepository.findOne({ where: { id_role: targetRoleId } });
        
        if (!targetRole) {
            throw new NotFoundException('El rol especificado no existe');
        }
        
        // SUPER_ADMIN solo por seeds/migración
        if (targetRole.name === 'super_admin') {
            throw new ConflictException('No se pueden crear usuarios SUPER_ADMIN mediante API');
        }
        
        if (!this.canAssignRole(this.getHighestRole(admin.roles), targetRole.name)) {
            throw new ConflictException(`No tienes permisos para asignar el rol ${targetRole.name}`);
        }
    }

    // Agregar rol adicional
    async addRoleToUser(userId: number, roleId: number, adminUserId: number): Promise<User> {
        await this.validateRoleAssignment(adminUserId, roleId);
        
        const user = await this.findOne(userId);
        const newRole = await this.roleRepository.findOne({ where: { id_role: roleId } });
        
        if (!newRole) {
            throw new NotFoundException('Rol no encontrado');
        }
        // Verificar si ya tiene el rol
        if (user.hasRole(newRole.name)) {
            throw new ConflictException('El usuario ya tiene este rol asignado');
        }
        
        user.roles.push(newRole);
        return await this.userRepository.save(user);
    }

    // Remover rol (mantener al menos uno)
    async removeRoleFromUser(userId: number, roleId: number, adminUserId: number): Promise<User> {
        const user = await this.findOne(userId);
        
        if (user.roles.length <= 1) {
            throw new ConflictException('El usuario debe tener al menos un rol');
        }
        
        // No se puede remover el rol primario si es el único
        if (user.roles.length === 1) {
            throw new ConflictException('No se puede remover el rol si es el único rol del usuario');
        }
        
        user.roles = user.roles.filter(role => role.id_role !== roleId);
        
        return await this.userRepository.save(user);
    }

    // AGREGAR este método al final de la clase:
    private getHighestRole(roles: Role[]): string {
        const hierarchy = ['super_admin', 'general_admin', 'fair_admin', 'content_admin', 'auditor', 'entrepreneur', 'volunteer'];
        
        for (const roleHierarchy of hierarchy) {
            if (roles.some(role => role.name === roleHierarchy)) {
                return roleHierarchy;
            }
        }
        return 'volunteer'; // Fallback
    }

    async createCompleteUserInvitation(dto: CreateCompleteInvitationDto, adminId: number): Promise<{ message: string; userId: number }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Verificar email único (MANTENER)
            const existingPerson = await queryRunner.manager.findOne(Person, { 
            where: { email: dto.email } 
            });
            
            if (existingPerson) {
            throw new ConflictException('Ya existe una persona con este email');
            }

            // 2. Crear Person (MANTENER)
            const person = queryRunner.manager.create(Person, {
            first_name: dto.first_name,
            second_name: dto.second_name,
            first_lastname: dto.first_lastname,
            second_lastname: dto.second_lastname,
            email: dto.email,
            });
            
            const savedPerson = await queryRunner.manager.save(Person, person);

            // 3. Crear phones (MANTENER)
            for (const phoneData of dto.phones) {
            const phone = queryRunner.manager.create(Phone, {
                ...phoneData,
                person: savedPerson
            });
            await queryRunner.manager.save(Phone, phone);
            }

            // 4. REEMPLAZAR TODA LA LÓGICA DE USUARIO por delegación:
            const result = await this.accountInvitationService.createUserAccount(
            savedPerson.id_person,
            dto.id_roles,
            adminId,
            queryRunner
            );

            await queryRunner.commitTransaction();
            return result;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
        }

    async updateUserRoles(userId: number, newRoleIds: number[], adminId: number): Promise<User> {
        if (newRoleIds.length === 0) {
            throw new ConflictException('El usuario debe tener al menos un rol');
        }

        const user = await this.findOne(userId);
        
        // Validar que todos los roles existen
        const newRoles = await this.roleRepository.find({
            where: { id_role: In(newRoleIds) }
        });
        
        if (newRoles.length !== newRoleIds.length) {
            throw new NotFoundException('Uno o más roles no existen');
        }
        
        // Verificar que no incluye super_admin
        if (newRoles.some(role => role.name === 'super_admin')) {
            throw new ConflictException('No se pueden asignar roles SUPER_ADMIN mediante API');
        }
        
        // Validar permisos del admin para TODOS los nuevos roles
        const admin = await this.findOne(adminId);
        const adminHighestRole = this.getHighestRole(admin.roles);
        
        for (const role of newRoles) {
            if (!this.canAssignRole(adminHighestRole, role.name)) {
                throw new ConflictException(`No tienes permisos para asignar el rol ${role.name}`);
            }
        }
        
        // Reemplazar todos los roles
        user.roles = newRoles;
        return await this.userRepository.save(user);
    }
}


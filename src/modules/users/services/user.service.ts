import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { CreateUserDto } from "../dto/user.dto";
import { Person } from "src/entities/person.entity";
import { UpdateUserDto } from "../dto/userUpdateDto";
import { PasswordService } from "src/modules/auth/services/password.service";

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

        const role = await this.roleRepository.findOne({
            where: { id_role: createUserDto.id_role }
        });

        if (!role) {
            throw new NotFoundException('El rol especificado no existe');
        }

        const hashedPassword = await this.passwordService.hashPassword(createUserDto.password);

        const user = this.userRepository.create({
            password: hashedPassword,
            status: createUserDto.status ?? true,
            person: { id_person: createUserDto.id_person } as Person,
            role: { id_role: createUserDto.id_role } as Role,
            isEmailVerified: false,
            failedLoginAttempts: 0,
            createdAt: new Date(),
        });

        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({ 
            relations: ['role', 'person'],
            order: { createdAt: 'DESC' } // Más recientes primero
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
        if (updateUserDto.id_role && updateUserDto.id_role !== user.role.id_role) {
            const role = await this.roleRepository.findOne({
                where: { id_role: updateUserDto.id_role }
            });

            if (!role) {
                throw new NotFoundException('El rol especificado no existe');
            }
        }

        const { id_role, ...dataWithoutIdRole } = updateUserDto;
        const updateData: any = { ...dataWithoutIdRole };

        if (id_role) {
            updateData.role = { id_role: id_role };
        }

        await this.userRepository.update(id, updateData);
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
            relations: ['role', 'person'],
        });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    // Encontrar usuario por email (para auth y admin dashboard)
    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .innerJoinAndSelect('user.role', 'role')
            .where('person.email = :email', { email })
            .getOne();
    }

    
    //Listar usuarios por rol (para admin)
    async findByRole(roleName: string): Promise<User[]> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.person', 'person')
            .innerJoinAndSelect('user.role', 'role')
            .where('role.name = :roleName', { roleName })
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

    // Cambiar rol de ususario
    async changeUserRole(userId: number, newRoleId: number, changedBy: number): Promise<User> {
        const user = await this.findOne(userId);
        const newRole = await this.roleRepository.findOne({ where: { id_role: newRoleId } });

        if (!newRole) {
            throw new NotFoundException('Rol no encontrado');
        }

        // Verificar permisos de quien cambia el rol
        const admin = await this.findOne(changedBy);
        if (!this.canChangeRole(admin.role.name, newRole.name)) {
            throw new ConflictException('No tienes permisos para asignar este rol');
        }

        await this.userRepository.update(userId, {
            role: { id_role: newRoleId }
        });

        return this.findOne(userId);
    }

    // Lógica de permisos para cambiar roles
    private canChangeRole(adminRole: string, targetRole: string): boolean {
        const roleHierarchy = {
            'super_admin': ['admin_general', 'admin_ferias', 'fiscalizador', 'emprendedor'],
            'admin_general': ['admin_ferias', 'fiscalizador', 'emprendedor'],
            'admin_ferias': ['emprendedor'],
        };

        return roleHierarchy[adminRole]?.includes(targetRole) || false;
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
                .innerJoin('user.role', 'role')
                .select('role.name', 'role')
                .addSelect('COUNT(*)', 'count')
                .groupBy('role.name')
                .getRawMany(),
            this.userRepository.count({ 
                where: { status: false },
                relations: ['role'],
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

    /**
     * Soft delete (mejor que delete permanente)
     */
    async softDelete(id: number): Promise<void> {
        const user = await this.findOne(id);
        
        // Marcar como inactivo en lugar de eliminar
        await this.userRepository.update(id, {
            status: false,
            // Podrías agregar deletedAt: new Date()
        });
    }
}
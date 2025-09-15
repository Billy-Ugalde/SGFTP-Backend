import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Person } from '../../../entities/person.entity';
import { Role } from './role.entity';
import { BadRequestException } from '@nestjs/common';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id_user: number;

    @Column({ type: 'varchar', length: 255, select: false })
    @Exclude()
    password: string;

    @Column({ type: 'boolean', default: true })
    status: boolean;

    @Column({ type: 'boolean', default: false })
    isEmailVerified: boolean;

    @Column({ type: 'int', default: 0 })
    failedLoginAttempts: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relación one-to-one con Person
    @ManyToOne(() => Person, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'person_id' })
    person: Person;

    // Relación many-to-many con Role (unidireccional)
    @ManyToMany(() => Role, { eager: true })
    @JoinTable({
        name: 'user_roles',
        joinColumn: { name: 'user_id', referencedColumnName: 'id_user' },
        inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id_role' }
    })
    roles: Role[];

    // Rol primario (debe estar en roles[])
    @ManyToOne(() => Role, { eager: true })
    @JoinColumn({ name: 'primary_role_id' })
    primaryRole: Role;

    // Validaciones de negocio
    @BeforeInsert()
    @BeforeUpdate()
    validateRoles() {
        if (!this.roles || this.roles.length === 0) {
            throw new BadRequestException('El usuario debe tener al menos un rol');
        }

        if (this.primaryRole && !this.roles.some(role => role.id_role === this.primaryRole.id_role)) {
            throw new BadRequestException('El rol primario debe estar incluido en la lista de roles');
        }

        // Validar roles únicos
        const roleIds = this.roles.map(role => role.id_role);
        const uniqueRoleIds = new Set(roleIds);
        if (roleIds.length !== uniqueRoleIds.size) {
            throw new BadRequestException('No se pueden asignar roles duplicados');
        }
    }

    // Métodos de utilidad
    getAllRoleNames(): string[] {
        return this.roles?.map(role => role.name) || [];
    }

    hasRole(roleName: string): boolean {
        return this.getAllRoleNames().includes(roleName);
    }

    hasAnyRole(roleNames: string[]): boolean {
        const userRoles = this.getAllRoleNames();
        return roleNames.some(role => userRoles.includes(role));
    }

    // Para JWT payload
    toJwtPayload(): { sub: string; email: string; roles: string[]; primaryRole: string } {
        return {
            sub: this.id_user.toString(),
            email: this.person.email,
            roles: this.getAllRoleNames(),
            primaryRole: this.primaryRole.name
        };
    }

    // Verificar si está activo y verificado
    isActive(): boolean {
        return this.status && this.isEmailVerified;
    }
}
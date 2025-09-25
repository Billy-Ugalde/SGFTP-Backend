import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Person } from '../../../entities/person.entity';
import { Role } from './role.entity';
import { BadRequestException } from '@nestjs/common';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id_user: number;

    @Column({ type: 'varchar', length: 255, select: false,  nullable: true })
    @Exclude()
    password?: string;

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

    // Relación one-to-one con Person CAMBIO
    @OneToOne(() => Person, { 
       //eager: true,
         onDelete: 'CASCADE' })
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

    @Column({ nullable: true })
    activation_token?: string;

    @Column({ nullable: true, type: 'timestamp' })
    activation_expires?: Date;

    @Column({ nullable: true })
    reset_token?: string;

    @Column({ nullable: true, type: 'timestamp' })
    reset_expires?: Date;

    // Validaciones de negocio
    @BeforeInsert()
    @BeforeUpdate()
    validateRoles() {
        if (!this.roles || this.roles.length === 0) {
            throw new BadRequestException('El usuario debe tener al menos un rol');
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
    toJwtPayload(): { sub: string; email: string; roles: string[]} {
        return {
            sub: this.id_user.toString(),
            email: this.person.email,
            roles: this.getAllRoleNames()
        };
    }

    // Verificar si está activo y verificado
    isActive(): boolean {
        return this.status && this.isEmailVerified;
    }
}
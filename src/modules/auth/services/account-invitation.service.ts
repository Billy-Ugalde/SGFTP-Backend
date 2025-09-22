import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, QueryRunner } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { Person } from '../../../entities/person.entity';
import { PasswordService } from '../../shared/services/password.service';
import { AuthEmailService } from './auth-email.service';

@Injectable()
export class AccountInvitationService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    private passwordService: PasswordService,
    private authEmailService: AuthEmailService,
  ) {}

  /**
   * LÓGICA UNIFICADA: Crear cuenta con roles y enviar email
   */
  async createUserAccount(
    personId: number,
    roleIds: number[],
    invitedBy: number,
    queryRunner?: QueryRunner
  ): Promise<{ message: string; userId: number }> {
    const manager = queryRunner?.manager || this.userRepository.manager;

    // 1. Validar persona existe y no tiene usuario
    const person = await manager.findOne(Person, {
      where: { id_person: personId },
      relations: ['user']
    });

    if (!person) {
      throw new NotFoundException('La persona especificada no existe');
    }

    if (person.user) {
      throw new ConflictException('Esta persona ya tiene un usuario asociado');
    }

    // 2. Validar roles existen
    const roles = await manager.find(Role, {
      where: { id_role: In(roleIds) }
    });

    if (roles.length !== roleIds.length) {
      throw new NotFoundException('Uno o más roles no existen');
    }

    if (roles.some(role => role.name === 'super_admin')) {
      throw new ConflictException('No se pueden crear cuentas para SUPER_ADMIN');
    }

    // 3. Validar permisos del admin (solo si no es sistema)
    if (invitedBy > 0) {
      await this.validateAdminPermissions(invitedBy, roles, manager);
    }

    // 4. Crear usuario con token de activación
    const activationToken = require('crypto').randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 72); // 24 horas

    const user = manager.create(User, {// Sin contraseña inicial
    activation_token: activationToken,
    activation_expires: tokenExpires,
    status: false, // Pendiente de activación
    person: { id_person: personId },
    roles: roles,
    isEmailVerified: false,
    failedLoginAttempts: 0,
    });

    const savedUser = await manager.save(User, user);

    // 5. Enviar email
    try {
        const activationLink = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;

        await this.authEmailService.sendAccountActivationEmail(
        person.email,
        `${person.first_name} ${person.first_lastname}`,
        activationLink, // ← Enlace en lugar de contraseña
        roles.map(r => r.name)
        );
      console.log(`[AccountInvitationService] Email enviado a: ${person.email}`);
    } catch (emailError) {
      console.error(`[AccountInvitationService] Error enviando email: ${emailError.message}`);
    }

    return {
      message: 'Cuenta creada y email enviado',
      userId: savedUser.id_user
    };
  }

  private async validateAdminPermissions(adminId: number, targetRoles: Role[], manager: any): Promise<void> {
    const admin = await manager.findOne(User, {
      where: { id_user: adminId },
      relations: ['roles']
    });

    if (!admin) {
      throw new NotFoundException('Admin no encontrado');
    }

    const adminHighestRole = this.getHighestRole(admin.roles);
    
    for (const role of targetRoles) {
      if (!this.canAssignRole(adminHighestRole, role.name)) {
        throw new ConflictException(`No tienes permisos para asignar el rol ${role.name}`);
      }
    }
  }

  private canAssignRole(adminRole: string, targetRole: string): boolean {
    const roleHierarchy = {
      'super_admin': ['general_admin', 'fair_admin', 'content_admin', 'auditor', 'entrepreneur', 'volunteer'],
      'general_admin': ['fair_admin', 'content_admin', 'auditor', 'entrepreneur', 'volunteer'],
      'fair_admin': ['entrepreneur', 'volunteer'],
      'content_admin': ['entrepreneur', 'volunteer'],
      'auditor': []
    };

    return roleHierarchy[adminRole]?.includes(targetRole) || false;
  }

  private getHighestRole(roles: Role[]): string {
    const hierarchy = ['super_admin', 'general_admin', 'fair_admin', 'content_admin', 'auditor', 'entrepreneur', 'volunteer'];
    
    for (const roleHierarchy of hierarchy) {
      if (roles.some(role => role.name === roleHierarchy)) {
        return roleHierarchy;
      }
    }
    return 'volunteer';
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Person } from '../../../entities/person.entity';
import { UserRole } from '../../auth/enums/user-role.enum';
import { PasswordService } from '../../shared/services/password.service';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    @InjectRepository(Person) private personRepository: Repository<Person>,
    private passwordService: PasswordService,
  ) {}

  async seedTestUsers(): Promise<void> {
    const testUsers = [
      {
        email: 'super@test.com',
        password: 'Test123!@#',
        first_name: 'Super',
        first_lastname: 'Admin',
        phone_primary: '88888888',
        role: UserRole.SUPER_ADMIN
      },
      {
        email: 'admin@test.com',
        password: 'Test123!@#',
        first_name: 'General',
        first_lastname: 'Admin',
        phone_primary: '87777777',
        role: UserRole.GENERAL_ADMIN
      },
      {
        email: 'fair@test.com',
        password: 'Test123!@#',
        first_name: 'Fair',
        first_lastname: 'Admin',
        phone_primary: '86666666',
        role: UserRole.FAIR_ADMIN
      },
      {
        email: 'entrepreneur@test.com',
        password: 'Test123!@#',
        first_name: 'Test',
        first_lastname: 'Entrepreneur',
        phone_primary: '85555555',
        role: UserRole.ENTREPRENEUR
      },
      {
        email: 'content@test.com',
        password: 'Test123!@#',
        first_name: 'Test',
        first_lastname: 'Content',
        phone_primary: '84444444',
        role: UserRole.CONTENT_ADMIN
      }
    ];

    for (const userData of testUsers) {
      await this.createTestUser(userData);
    }
  }

  // En user-seed.service.ts - Actualizar el método createTestUser:

  private async createTestUser(userData: any): Promise<void> {
    // Verificar si ya existe
    const existingPerson = await this.personRepository.findOne({
        where: { email: userData.email }
    });

    if (existingPerson) {
        console.log(`User ${userData.email} already exists`);
        return;
    }

    // Crear Person
    const person = this.personRepository.create({
        first_name: userData.first_name,
        second_name: '',
        first_lastname: userData.first_lastname,
        second_lastname: '',
        email: userData.email,
        phone_primary: userData.phone_primary,
    });
    const savedPerson = await this.personRepository.save(person);

    // Buscar rol
    const role = await this.roleRepository.findOne({
        where: { name: userData.role }
    });

    if (!role) {
        throw new Error(`Role ${userData.role} not found`);
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(userData.password);

    // ✅ CREAR USER CON NUEVA ESTRUCTURA:
    const user = this.userRepository.create({
        password: hashedPassword,
        status: true,
        isEmailVerified: true,
        failedLoginAttempts: 0,
        person: savedPerson,
        roles: [role], 
    });

    await this.userRepository.save(user);
    console.log(`Test user ${userData.email} created with role ${userData.role}`);
  }
}
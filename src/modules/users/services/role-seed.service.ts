import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../../auth/enums/user-role.enum';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async seedRoles(): Promise<void> {
    const roles = [
      { name: UserRole.SUPER_ADMIN },
      { name: UserRole.GENERAL_ADMIN },
      { name: UserRole.FAIR_ADMIN },
      { name: UserRole.CONTENT_ADMIN },
      { name: UserRole.AUDITOR },
      { name: UserRole.ENTREPRENEUR },
      { name: UserRole.VOLUNTEER }
    ];

    console.log('🌱 Starting role seeding...');

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({ 
        where: { name: roleData.name } 
      });
      
      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        console.log(`✅ Role ${roleData.name} created`);
      } else {
        console.log(`ℹ️  Role ${roleData.name} already exists`);
      }
    }
    
    console.log('✅ Role seeding completed');
  }
}
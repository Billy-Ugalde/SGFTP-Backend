import { Injectable, OnModuleInit } from '@nestjs/common';
import { InformativeSeedService } from '../../modules/informative/services/informative-seed.service';
import { RoleSeedService } from '../../modules/users/services/role-seed.service';
import { UserSeedService } from '../../modules/users/services/user-seed.service';

@Injectable()
export class GlobalSeedService implements OnModuleInit {
  constructor(
    private readonly roleSeedService: RoleSeedService,
    private readonly informativeSeedService: InformativeSeedService,
    private readonly userSeedService: UserSeedService,
  ) {}

  async onModuleInit() {
    // Orden importante: roles primero, luego contenido
    await this.roleSeedService.seedRoles();
    await this.informativeSeedService.seedInformativeContent();
    await this.userSeedService.seedTestUsers();
  }
}
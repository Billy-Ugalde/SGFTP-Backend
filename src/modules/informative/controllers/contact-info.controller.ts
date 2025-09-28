import { Controller, Get, Patch,Body, UseGuards} from '@nestjs/common';
import { ContactInfoService } from '../services/contact-info.service';
import { UpdateContactInfoDto } from '../dto/update-contact-info.dto';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { Public } from '../../auth/decorators/public.decorator'


@Controller('contact-info')
@UseGuards(AuthGuard)
export class ContactInfoController {
  constructor(private readonly contactInfoService: ContactInfoService) {}

  @Get()
  @Public()
  get() {
    return this.contactInfoService.get();
  }

  @Patch()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  update(@Body() updateDto: UpdateContactInfoDto) {
    return this.contactInfoService.update(updateDto);
  }
}
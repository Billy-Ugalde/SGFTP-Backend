import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DonorService } from '../donor.service';
import { CreateDonorDto } from '../dto/create-donor.dto';
import { UpdateDonorDto } from '../dto/update-donor.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('donors')
@UseGuards(AuthGuard)
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Post()
  @Public()
  create(@Body() createDonorDto: CreateDonorDto) {
    return this.donorService.create(createDonorDto);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
  findAll() {
    return this.donorService.findAll();
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.donorService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDonorDto: UpdateDonorDto) {
    return this.donorService.update(id, updateDonorDto);
  }

  @Patch(':id/archive')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.donorService.archive(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req
} from '@nestjs/common';
import { EntrepreneurService } from '../services/entrepreneur.service';
import { CreateCompleteEntrepreneurDto, UpdateCompleteEntrepreneurDto } from '../dto/complete-entrepreneur.dto';
import { UpdateStatusDto, ToggleActiveDto } from '../dto/entrepreneur.dto';
import { Entrepreneur } from '../entities/entrepreneur.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { Public } from 'src/modules/auth/decorators/public.decorator';

@Controller('entrepreneurs')
@UseGuards(AuthGuard)
export class EntrepreneurController {
  constructor(private readonly entrepreneurService: EntrepreneurService) { }

  @Get()
  @Public()
  async findAllApproved(): Promise<Entrepreneur[]> {
    return await this.entrepreneurService.findAllApproved();
  }

  @Get('pending')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.AUDITOR)
  async findAllPending(@Req() request: any): Promise<Entrepreneur[]> {
    return await this.entrepreneurService.findAllPending();
  }


  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Entrepreneur> {
    return await this.entrepreneurService.findOne(id);
  }

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateCompleteEntrepreneurDto, @Req() request: any): Promise<Entrepreneur> {
    return await this.entrepreneurService.create(createDto, request);
  }

  @Post('public')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async createPublic(@Body() dto: CreateCompleteEntrepreneurDto): Promise<Entrepreneur> {
    return await this.entrepreneurService.create(dto); 
  }


  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.ENTREPRENEUR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCompleteEntrepreneurDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.update(id, updateDto);
  }


  @Patch(':id/status')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: UpdateStatusDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.updateStatus(id, statusDto);
  }


  @Patch(':id/toggle-active')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() toggleDto: ToggleActiveDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.toggleActive(id, toggleDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.entrepreneurService.remove(id);
  }

}
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
  Req,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { Express } from 'express';
import { EntrepreneurService } from '../services/entrepreneur.service';
import { CreateCompleteEntrepreneurDto, UpdateCompleteEntrepreneurDto } from '../dto/complete-entrepreneur.dto';
import { UpdateStatusDto, ToggleActiveDto } from '../dto/entrepreneur.dto';
import { Entrepreneur } from '../entities/entrepreneur.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { Public } from 'src/modules/auth/decorators/public.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ParseJsonPipe } from './parse-json.pipe';

@Controller('entrepreneurs')
@UseGuards(AuthGuard)
export class EntrepreneurController {
  constructor(private readonly entrepreneurService: EntrepreneurService) {}

  @Get()
  @Public()
  async findAllApproved(): Promise<Entrepreneur[]> {
    return await this.entrepreneurService.findAllApproved();
  }

  @Get('pending')
  @UseGuards(RoleGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.GENERAL_ADMIN,
    UserRole.FAIR_ADMIN,
    UserRole.AUDITOR,
  )
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
  @UseInterceptors(FilesInterceptor('files', 3))
  async create(
    @Body('person', ParseJsonPipe) person: any,
    @Body('entrepreneur', ParseJsonPipe) entrepreneur: any,
    @Body('entrepreneurship', ParseJsonPipe) entrepreneurship: any,  @UploadedFiles() files: Express.Multer.File[], @Req() request: any): Promise<Entrepreneur> {
      const dto: CreateCompleteEntrepreneurDto = { person, entrepreneur, entrepreneurship };
      return await this.entrepreneurService.create(dto, request, files);
  }

  @Post('public')
  @Public()
  @HttpCode(HttpStatus.CREATED)
   @UseInterceptors(FilesInterceptor('files', 3))
  async createPublic(@Body('person', ParseJsonPipe) person: any,
    @Body('entrepreneur', ParseJsonPipe) entrepreneur: any,
    @Body('entrepreneurship', ParseJsonPipe) entrepreneurship: any, @UploadedFiles() files: Express.Multer.File[]): Promise<Entrepreneur> {
    const dto: CreateCompleteEntrepreneurDto = { person, entrepreneur, entrepreneurship };
    return await this.entrepreneurService.create(dto, undefined, files); 
  }

  // ================== NUEVO (colocado ANTES del Put(':id')) ==================
  // Ruta para que el dueño (usuario autenticado con rol entrepreneur) actualice su propio registro
  @Put('public/:id')
  @HttpCode(HttpStatus.OK)
  async updateOwn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompleteEntrepreneurDto,
    @Req() req: any,
  ): Promise<Entrepreneur> {
    return this.entrepreneurService.updateIfOwnerAndEntrepreneurRole(id, dto, req.user);
  }
  // ================== FIN NUEVO =================================================

  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  @UseInterceptors(FilesInterceptor('files', 3))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('person', ParseJsonPipe) person: any,
    @Body('entrepreneur', ParseJsonPipe) entrepreneur: any,
    @Body('entrepreneurship', ParseJsonPipe) entrepreneurship: any,
    @UploadedFiles() files: Express.Multer.File[]
    ): Promise<Entrepreneur> {
    const dto: UpdateCompleteEntrepreneurDto = { person, entrepreneur, entrepreneurship };
    return await this.entrepreneurService.update(id, dto, files);
  }

  @Patch(':id/status')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: UpdateStatusDto,
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.updateStatus(id, statusDto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() toggleDto: ToggleActiveDto,
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

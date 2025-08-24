import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch, 
  Param, 
  Body, 
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { EntrepreneurService } from '../services/entrepreneur.service';
import { CreateEntrepreneurDto, UpdateEntrepreneurDto, UpdateStatusDto, ToggleActiveDto } from '../dto/entrepreneur.dto';
import { Entrepreneur } from '../entities/entrepreneur.entity';

@Controller('entrepreneurs')
export class EntrepreneurController {
  constructor(private readonly entrepreneurService: EntrepreneurService) {}

  
  @Get()
  async findAllApproved(): Promise<Entrepreneur[]> {
    return await this.entrepreneurService.findAllApproved();
  }

 
  @Get('pending')
  async findAllPending(): Promise<Entrepreneur[]> {
    return await this.entrepreneurService.findAllPending();
  }

 
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Entrepreneur> {
    return await this.entrepreneurService.findOne(id);
  }


  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    createDto: CreateEntrepreneurDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.create(createDto);
  }


  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    updateDto: UpdateEntrepreneurDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.update(id, updateDto);
  }


  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    statusDto: UpdateStatusDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.updateStatus(id, statusDto);
  }

 
  @Patch(':id/toggle-status')
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) 
    toggleDto: ToggleActiveDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.toggleActive(id, toggleDto);
  }
}
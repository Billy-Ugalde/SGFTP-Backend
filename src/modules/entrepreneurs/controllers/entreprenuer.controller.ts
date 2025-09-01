import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { EntrepreneurService } from '../services/entrepreneur.service';
import { CreateCompleteEntrepreneurDto, UpdateCompleteEntrepreneurDto } from '../dto/complete-entrepreneur.dto';
import { UpdateStatusDto, ToggleActiveDto } from '../dto/entrepreneur.dto';
import { Entrepreneur } from '../entities/entrepreneur.entity';

@Controller('entrepreneurs')
export class EntrepreneurController {
  constructor(private readonly entrepreneurService: EntrepreneurService) { }


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
    @Body()createDto: CreateCompleteEntrepreneurDto): Promise<Entrepreneur> {
    return await this.entrepreneurService.create(createDto);
  }


  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCompleteEntrepreneurDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.update(id, updateDto);
  }


  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: UpdateStatusDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.updateStatus(id, statusDto);
  }


   @Patch(':id/toggle-active')
  async toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() toggleDto: ToggleActiveDto
  ): Promise<Entrepreneur> {
    return await this.entrepreneurService.toggleActive(id, toggleDto);
  }
}
import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsStatusDto } from './dto/news-status.dto';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator'

@Controller('news')
@UseGuards(AuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  create(@Body() createDto: CreateNewsDto) {
    return this.newsService.create(createDto);
  }

  @Get()
  @Public()
  getAll() {
    return this.newsService.getAll();
  }

  
  @Get(':id')
  @Public()
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.getOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateNewsDto) {
    return this.newsService.update(id, updateDto);
  }


  @Patch(':id/status')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() statusDto: NewsStatusDto) {
    return this.newsService.updateStatus(id, statusDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.delete(id);
  }
}
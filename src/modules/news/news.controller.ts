import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Delete, 
  ParseIntPipe, 
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsStatusDto } from './dto/news-status.dto';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { ParseJsonPipe } from '../shared/services/parse-json.pipe';

@Controller('news')
@UseGuards(AuthGuard)
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file')) // Una sola imagen
  create(
    @Body('news', ParseJsonPipe) newsData: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    const dto: CreateNewsDto = newsData;
    return this.newsService.create(dto, file);
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
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body('news', ParseJsonPipe) newsData: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    const dto: UpdateNewsDto = newsData;
    return this.newsService.update(id, dto, file);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.delete(id);
  }
}
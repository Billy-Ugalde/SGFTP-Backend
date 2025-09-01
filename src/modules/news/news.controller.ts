import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe } from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsStatusDto } from './dto/news-status.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  create(@Body() createDto: CreateNewsDto) {
    return this.newsService.create(createDto);
  }

  @Get()
  getAll() {
    return this.newsService.getAll();
  }

  
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.getOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateNewsDto) {
    return this.newsService.update(id, updateDto);
  }


  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() statusDto: NewsStatusDto) {
    return this.newsService.updateStatus(id, statusDto);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.delete(id);
  }
}
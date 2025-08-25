import { Controller, Get, Post, Body, Param, Patch, Delete,ParseIntPipe } from '@nestjs/common';
import { ContentBlockService } from '../services/content-block.service';
import { CreateContentBlockDto } from '../dto/create-content-block.dto';
import { UpdateContentBlockDto } from '../dto/update-content-block.dto';
import { StructuredContentDto } from '../dto/structured-content.dto';

@Controller('content')
export class ContentBlockController {
  constructor(private readonly contentService: ContentBlockService) {}

  @Post()
  create(@Body() createDto: CreateContentBlockDto) {
    return this.contentService.create(createDto);
  }

  @Post('batch')
  createBatch(@Body() blocksData: CreateContentBlockDto[]) {
    return this.contentService.updateOrCreateBatch(blocksData);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.findOne(id);
  }

  @Get('page/:page')
  getPageContent(@Param('page') page: string): Promise<StructuredContentDto> {
    return this.contentService.getPageContent(page);
  }

  @Get('page/:page/section/:section')
  getSectionContent(
    @Param('page') page: string,
    @Param('section') section: string
  ) {
    return this.contentService.findByPageAndSection(page, section);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateContentBlockDto) {
    return this.contentService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.remove(id);
  }
  
}  
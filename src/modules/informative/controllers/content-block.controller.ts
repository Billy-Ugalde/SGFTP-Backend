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

  @Get(':page/:section')
  getSectionContent(
    @Param('page') page: string,
    @Param('section') section: string
  ) {
    return this.contentService.findByPageAndSection(page, section);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.remove(id);
  }

  @Patch(':page/:section/:block_key')
updateByNaturalKey(
  @Param('page') page: string,
  @Param('section') section: string,
  @Param('block_key') block_key: string,
  @Body() updateDto: UpdateContentBlockDto
) {
  return this.contentService.updateByNaturalKey(page, section, block_key, updateDto);
}

@Get(':page/:section/:block_key')
findByNaturalKey(
  @Param('page') page: string,
  @Param('section') section: string,
  @Param('block_key') block_key: string
) {
  return this.contentService.findByNaturalKey(page, section, block_key);
}
  
}  
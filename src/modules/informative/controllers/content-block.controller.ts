import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ContentBlockService } from '../services/content-block.service';
import { CreateContentBlockDto } from '../dto/create-content-block.dto';
import { UpdateContentBlockDto } from '../dto/update-content-block.dto';
import { StructuredContentDto } from '../dto/structured-content.dto';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/modules/auth/decorators/public.decorator';

@UseGuards(AuthGuard)
@Controller('content')
export class ContentBlockController {
  constructor(private readonly contentService: ContentBlockService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  create(@Body() createDto: CreateContentBlockDto) {
    return this.contentService.create(createDto);
  }

  @Post('batch')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  createBatch(@Body() blocksData: CreateContentBlockDto[]) {
    return this.contentService.updateOrCreateBatch(blocksData);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.findOne(id);
  }

  @Get('page/:page')
  @Public()
  getPageContent(@Param('page') page: string): Promise<StructuredContentDto> {
    return this.contentService.getPageContent(page);
  }

  @Get(':page/:section')
  @Public()
  getSectionContent(
    @Param('page') page: string,
    @Param('section') section: string
  ) {
    return this.contentService.findByPageAndSection(page, section);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.remove(id);
  }

  // PATCH con upsert (crea si no existe, actualiza si existe)
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  @Patch(':page/:section/:block_key')
  updateOrCreateByNaturalKey(
    @Param('page') page: string,
    @Param('section') section: string,
    @Param('block_key') block_key: string,
    @Body() updateDto: UpdateContentBlockDto
  ) {
    // OJO: usar this.contentService (así se llama en el constructor)
    return this.contentService.updateOrCreateByNaturalKey(page, section, block_key, updateDto);
  }

  @Get(':page/:section/:block_key')
  @Public()
  findByNaturalKey(
    @Param('page') page: string,
    @Param('section') section: string,
    @Param('block_key') block_key: string
  ) {
    return this.contentService.findByNaturalKey(page, section, block_key);
  }
}

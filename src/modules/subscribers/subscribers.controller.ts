
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  BadRequestException,
  UseGuards
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { PreferredLanguage } from './entities/subscriber.entity';
import { UpdateSubscriberDto} from './dto/update-subscriber.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('subscribers')
@UseGuards(AuthGuard)
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  @Public()
  create(@Body() createSubscriberDto: CreateSubscriberDto) {
    return this.subscribersService.create(createSubscriberDto);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  findAll() {
    return this.subscribersService.findAll();
  }

  @Get('stats')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  getStats() {
    return this.subscribersService.getStats();
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSubscriberDto: UpdateSubscriberDto) {
    return this.subscribersService.update(id, updateSubscriberDto);
  }

  @Get('language/:lang')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  findByLanguage(@Param('lang') lang: string) {
    if (lang !== 'es' && lang !== 'en') {
      throw new BadRequestException('Language must be "es" or "en"');
    }

    const language = lang as PreferredLanguage;
    return this.subscribersService.findByLanguage(language);
  }

  @Get('language/spanish')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  findSpanishSubscribers() {
    return this.subscribersService.findSpanishSubscribers();
  }

  @Get('language/english')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  findEnglishSubscribers() {
    return this.subscribersService.findEnglishSubscribers();
  }

  @Get('stats/language/:lang')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  getStatsByLanguage(@Param('lang') lang: string) {
    if (lang !== 'es' && lang !== 'en') {
      throw new BadRequestException('Language must be "es" or "en"');
    }

    const language = lang as PreferredLanguage;
    return this.subscribersService.getStatsByLanguage(language);
  }

  @Get('search')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  findByName(
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string
  ) {
    if (!firstName && !lastName) {
      throw new BadRequestException('At least one search parameter (firstName or lastName) is required');
    }

    return this.subscribersService.findByName(firstName, lastName);
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscribersService.findOne(id);
  }

  @Get('email/:email')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  findByEmail(@Param('email') email: string) {
    return this.subscribersService.findByEmail(email);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.CONTENT_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscribersService.remove(id);
  }
}
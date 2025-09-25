
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
  BadRequestException
} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { PreferredLanguage } from './entities/subscriber.entity';
import { UpdateSubscriberDto} from './dto/update-subscriber.dto'

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  create(@Body() createSubscriberDto: CreateSubscriberDto) {
    return this.subscribersService.create(createSubscriberDto);
  }

  @Get()
  findAll() {
    return this.subscribersService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.subscribersService.getStats();
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateSubscriberDto: UpdateSubscriberDto) {
    return this.subscribersService.update(id, updateSubscriberDto);
  }

  @Get('language/:lang')
  findByLanguage(@Param('lang') lang: string) {
    if (lang !== 'es' && lang !== 'en') {
      throw new BadRequestException('Language must be "es" or "en"');
    }
    
    const language = lang as PreferredLanguage;
    return this.subscribersService.findByLanguage(language);
  }

  @Get('language/spanish')
  findSpanishSubscribers() {
    return this.subscribersService.findSpanishSubscribers();
  }

  @Get('language/english')
  findEnglishSubscribers() {
    return this.subscribersService.findEnglishSubscribers();
  }

  @Get('stats/language/:lang')
  getStatsByLanguage(@Param('lang') lang: string) {
    if (lang !== 'es' && lang !== 'en') {
      throw new BadRequestException('Language must be "es" or "en"');
    }
    
    const language = lang as PreferredLanguage;
    return this.subscribersService.getStatsByLanguage(language);
  }

  @Get('search')
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscribersService.findOne(id);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.subscribersService.findByEmail(email);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.subscribersService.remove(id);
  }
}
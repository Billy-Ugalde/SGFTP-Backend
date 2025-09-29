import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe} from '@nestjs/common';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

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
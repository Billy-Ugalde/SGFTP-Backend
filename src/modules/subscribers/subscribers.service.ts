import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private subscribersRepository: Repository<Subscriber>,
  ) {}

  async create(createSubscriberDto: CreateSubscriberDto): Promise<Subscriber> {
    // Check if email already exists
    const existingSubscriber = await this.subscribersRepository.findOne({
      where: { email: createSubscriberDto.email },
    });

    if (existingSubscriber) {
      throw new ConflictException('Email already subscribed');
    }

    const subscriber = this.subscribersRepository.create(createSubscriberDto);
    return await this.subscribersRepository.save(subscriber);
  }

  async findAll(): Promise<Subscriber[]> {
    return await this.subscribersRepository.find();
  }

  async findOne(id: number): Promise<Subscriber> {
    const subscriber = await this.subscribersRepository.findOne({ where: { id } });
    
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }
    
    return subscriber;
  }

  async findByEmail(email: string): Promise<Subscriber> {
    const subscriber = await this.subscribersRepository.findOne({ where: { email } });
    
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with email ${email} not found`);
    }
    
    return subscriber;
  }

  async remove(id: number): Promise<void> {
    const result = await this.subscribersRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }
  }

  async getStats() {
    const total = await this.subscribersRepository.count();
    
    // Get today's subscribers
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get this month's subscribers
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthSubscribers = await this.subscribersRepository
      .createQueryBuilder('subscriber')
      .where('subscriber.createdAt >= :firstDayOfMonth', { firstDayOfMonth })
      .getCount();
    
    return {
      total,
      month: monthSubscribers,
    };
  }
}
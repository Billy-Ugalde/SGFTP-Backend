import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber, PreferredLanguage } from './entities/subscriber.entity';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto} from './dto/update-subscriber.dto'

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

    const subscriber = this.subscribersRepository.create({
      ...createSubscriberDto,
      preferredLanguage: createSubscriberDto.preferredLanguage || PreferredLanguage.SPANISH
    });
    
    return await this.subscribersRepository.save(subscriber);
  }

  async findAll(): Promise<Subscriber[]> {
    return await this.subscribersRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findByLanguage(language: PreferredLanguage): Promise<Subscriber[]> {
    return await this.subscribersRepository.find({
      where: { preferredLanguage: language },
      order: { createdAt: 'DESC' }
    });
  }

  async findSpanishSubscribers(): Promise<Subscriber[]> {
    return this.findByLanguage(PreferredLanguage.SPANISH);
  }

  async findEnglishSubscribers(): Promise<Subscriber[]> {
    return this.findByLanguage(PreferredLanguage.ENGLISH);
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

  async findByName(firstName?: string, lastName?: string): Promise<Subscriber[]> {
    const query = this.subscribersRepository.createQueryBuilder('subscriber');
    
    if (firstName) {
      query.andWhere('LOWER(subscriber.firstName) LIKE LOWER(:firstName)', { 
        firstName: `%${firstName}%` 
      });
    }
    
    if (lastName) {
      query.andWhere('LOWER(subscriber.lastName) LIKE LOWER(:lastName)', { 
        lastName: `%${lastName}%` 
      });
    }
    
    return await query.orderBy('subscriber.createdAt', 'DESC').getMany();
  }

async update(id: number, updateSubscriberDto: UpdateSubscriberDto): Promise<Subscriber>{
    // Check if subscriber exists
    const subscriber = await this.subscribersRepository.findOne({ where: { id } });
    
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }

    // If email is being updated, check if new email already exists
    if (updateSubscriberDto.email && updateSubscriberDto.email !== subscriber.email) {
      const existingSubscriber = await this.subscribersRepository.findOne({
        where: { email: updateSubscriberDto.email },
      });

      if (existingSubscriber) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update the subscriber
    Object.assign(subscriber, updateSubscriberDto);
    
    return await this.subscribersRepository.save(subscriber);
  }

  async remove(id: number): Promise<void> {
    const result = await this.subscribersRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Subscriber with ID ${id} not found`);
    }
  }

  async getStats() {
    const total = await this.subscribersRepository.count();
    
    // Get language statistics
    const spanishCount = await this.subscribersRepository.count({
      where: { preferredLanguage: PreferredLanguage.SPANISH }
    });
    
    const englishCount = await this.subscribersRepository.count({
      where: { preferredLanguage: PreferredLanguage.ENGLISH }
    });
    
    // Get today's subscribers
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaySubscribers = await this.subscribersRepository
      .createQueryBuilder('subscriber')
      .where('subscriber.createdAt >= :today AND subscriber.createdAt < :tomorrow', { 
        today, 
        tomorrow 
      })
      .getCount();
    
    // Get this month's subscribers
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthSubscribers = await this.subscribersRepository
      .createQueryBuilder('subscriber')
      .where('subscriber.createdAt >= :firstDayOfMonth', { firstDayOfMonth })
      .getCount();
    
    // Get monthly stats by language
    const monthSpanishSubscribers = await this.subscribersRepository
      .createQueryBuilder('subscriber')
      .where('subscriber.createdAt >= :firstDayOfMonth', { firstDayOfMonth })
      .andWhere('subscriber.preferredLanguage = :language', { language: PreferredLanguage.SPANISH })
      .getCount();
    
    const monthEnglishSubscribers = await this.subscribersRepository
      .createQueryBuilder('subscriber')
      .where('subscriber.createdAt >= :firstDayOfMonth', { firstDayOfMonth })
      .andWhere('subscriber.preferredLanguage = :language', { language: PreferredLanguage.ENGLISH })
      .getCount();
    
    return {
      total,
      today: todaySubscribers,
      month: monthSubscribers,
      byLanguage: {
        spanish: spanishCount,
        english: englishCount
      },
      monthByLanguage: {
        spanish: monthSpanishSubscribers,
        english: monthEnglishSubscribers
      }
    };
  }

  async getStatsByLanguage(language: PreferredLanguage) {
    const total = await this.subscribersRepository.count({
      where: { preferredLanguage: language }
    });
    
    // Get today's subscribers for this language
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaySubscribers = await this.subscribersRepository
      .createQueryBuilder('subscriber')
      .where('subscriber.createdAt >= :today AND subscriber.createdAt < :tomorrow', { 
        today, 
        tomorrow 
      })
      .andWhere('subscriber.preferredLanguage = :language', { language })
      .getCount();
    
    // Get this month's subscribers for this language
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthSubscribers = await this.subscribersRepository
      .createQueryBuilder('subscriber')
      .where('subscriber.createdAt >= :firstDayOfMonth', { firstDayOfMonth })
      .andWhere('subscriber.preferredLanguage = :language', { language })
      .getCount();
    
    return {
      total,
      today: todaySubscribers,
      month: monthSubscribers,
      language
    };
  }
}
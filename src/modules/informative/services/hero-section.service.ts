import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroSection } from '../entities/hero-section.entity';
import { UpdateHeroDto } from '../dto/update-hero.dto';

@Injectable()
export class HeroSectionService {
  constructor(
    @InjectRepository(HeroSection)
    private readonly repo: Repository<HeroSection>,
  ) {}

  async get(): Promise<HeroSection> {
    return this.repo.findOneByOrFail({ id: 'hero' });
  }

  async update(dto: UpdateHeroDto): Promise<HeroSection> {
    await this.repo.update('hero', dto);
    return this.get();
  }
}

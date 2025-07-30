import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SectionDescription } from '../entities/section-description.entity';

@Injectable()
export class SectionDescriptionService {
  constructor(
    @InjectRepository(SectionDescription)
    private readonly repo: Repository<SectionDescription>,
  ) {}

  async get(id: string): Promise<SectionDescription> {
    return this.repo.findOneByOrFail({ id });
  }

  async update(id: string, data: Partial<SectionDescription>): Promise<SectionDescription> {
    await this.repo.update(id, data);
    return this.get(id);
  }
}


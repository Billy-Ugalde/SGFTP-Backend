import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvolveCard } from '../entities/involve-card.entity';
import { UpdateInvolveCardDto } from '../dto/update-involve-card.dto';

@Injectable()
export class InvolveCardService {
  constructor(
    @InjectRepository(InvolveCard)
    private readonly repo: Repository<InvolveCard>,
  ) {}

  async findAll(): Promise<InvolveCard[]> {
    return this.repo.find();
  }

  async upsert(dto: UpdateInvolveCardDto): Promise<InvolveCard> {
    const existing = await this.repo.findOneBy({ id: dto.id });
    if (existing) {
      await this.repo.update(dto.id, dto);
      return this.repo.findOneByOrFail({ id: dto.id });
    }
    return this.repo.save(dto);
  }
}

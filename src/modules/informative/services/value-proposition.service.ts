import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValueProposition } from '../entities/value-proposition.entity';
import { UpdateValuePropositionDto } from '../dto/update-value-proposition.dto';

@Injectable()
export class ValuePropositionService {
  constructor(
    @InjectRepository(ValueProposition)
    private readonly repo: Repository<ValueProposition>,
  ) {}

  async get(): Promise<ValueProposition> {
    return this.repo.findOneByOrFail({ id: 'value_proposition' });
  }

  async update(dto: UpdateValuePropositionDto): Promise<ValueProposition> {
    await this.repo.update('value_proposition', dto);
    return this.get();
  }
}

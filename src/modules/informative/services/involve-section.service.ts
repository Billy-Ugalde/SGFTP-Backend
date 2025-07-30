import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvolveSection } from '../entities/involve-section.entity';
import { UpdateInvolveSectionDto } from '../dto/update-involve-section.dto';

@Injectable()
export class InvolveSectionService {
  constructor(
    @InjectRepository(InvolveSection)
    private readonly repo: Repository<InvolveSection>,
  ) {}

  async get(): Promise<InvolveSection> {
    return this.repo.findOneByOrFail({ id: 'involve_section' });
  }

  async update(dto: UpdateInvolveSectionDto): Promise<InvolveSection> {
    await this.repo.update('involve_section', dto);
    return this.get();
  }
}

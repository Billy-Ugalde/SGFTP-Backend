import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import { Entrepreneurship } from '../entities/entrepreneurship.entity';
import { CreateEntrepreneurshipDto, UpdateEntrepreneurshipDto } from '../dto/entrepreneurship.dto';

@Injectable()
export class EntrepreneurshipService {
  constructor(
    @InjectRepository(Entrepreneurship)
    private entrepreneurshipRepository: Repository<Entrepreneurship>,
  ) {}

  async create(
    entrepreneurId: number, 
    createDto: CreateEntrepreneurshipDto, 
    queryRunner: QueryRunner
  ): Promise<Entrepreneurship> {
    const entrepreneurship = this.entrepreneurshipRepository.create({
      ...createDto,
      id_entrepreneur: entrepreneurId,
    });

    return await queryRunner.manager.save(Entrepreneurship, entrepreneurship);
  }

  async update(
    entrepreneurshipId: number, 
    updateDto: UpdateEntrepreneurshipDto, 
    queryRunner: QueryRunner
  ): Promise<void> {
    const updateData: Partial<Entrepreneurship> = {};
    
    if (updateDto.name) updateData.name = updateDto.name;
    if (updateDto.description) updateData.description = updateDto.description;
    if (updateDto.location) updateData.location = updateDto.location;
    if (updateDto.category) updateData.category = updateDto.category;
    if (updateDto.approach) updateData.approach = updateDto.approach;
    if (updateDto.url_1 !== undefined) updateData.url_1 = updateDto.url_1;
    if (updateDto.url_2 !== undefined) updateData.url_2 = updateDto.url_2;
    if (updateDto.url_3 !== undefined) updateData.url_3 = updateDto.url_3;

    if (Object.keys(updateData).length > 0) {
      await queryRunner.manager.update(Entrepreneurship, entrepreneurshipId, updateData);
    }
  }

  async findByEntrepreneurId(entrepreneurId: number): Promise<Entrepreneurship | null> {
    return await this.entrepreneurshipRepository.findOne({
      where: { id_entrepreneur: entrepreneurId }
    });
  }
}
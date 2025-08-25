import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from '../entities/content-block.entity';
import { CreateContentBlockDto } from '../dto/create-content-block.dto';
import { UpdateContentBlockDto } from '../dto/update-content-block.dto';
import { StructuredContentDto } from '../dto/structured-content.dto';

@Injectable()
export class ContentBlockService {
  constructor(
    @InjectRepository(ContentBlock)
    private readonly contentBlockRepository: Repository<ContentBlock>,
  ) {}

  async create(createDto: CreateContentBlockDto): Promise<ContentBlock> {
    const newBlock = this.contentBlockRepository.create(createDto);
    return this.contentBlockRepository.save(newBlock);
  }

  async update(id: number, updateDto: UpdateContentBlockDto): Promise<ContentBlock> {
    const block = await this.findOne(id);
    Object.assign(block, updateDto);
    return this.contentBlockRepository.save(block);
  }

  async remove(id: number): Promise<void> {
    await this.contentBlockRepository.delete(id);
  }

  async findOne(id: number): Promise<ContentBlock> {
    const block = await this.contentBlockRepository.findOne({ where: { id } });
    if (!block) {
      throw new NotFoundException(`ContentBlock with ID ${id} not found`);
    }
    return block;
  }

  async findByPageAndSection(page: string, section: string,): Promise<Record<string, string | null>> {
    const blocks = await this.contentBlockRepository.find({ where: { page, section } });
    const out: Record<string, string | null> = {};
    for (const b of blocks) {
      out[b.block_key] = b.text_content ?? b.image_url ?? null;
    }
    return out;
  }

  /*
  async findByPageAndSection(page: string,section: string,): Promise<Record<string, Record<string, string | null>>> {
  const blocks = await this.contentBlockRepository.find({ where: { page, section } });

  // Reusa el helper para mantener el mismo formato exacto
  // mapBlocksToSlim devuelve { [sectionName]: { block_key: value } } para todas las secciones incluidas;
  // como aquí solo hay una sección, estará en esa clave.
  const full = this.mapBlocksToSlim(blocks);

  // Asegura que exista la clave aunque no haya bloques
  if (!full[section]) {
    full[section] = {};
  }

  return full;
}*/

  async getPageContent(page: string): Promise<Record<string, Record<string, string | null>>> {
    const blocks = await this.contentBlockRepository.find({ where: { page } });
    return this.mapBlocksToSlim(blocks);
  }

  async updateOrCreateBatch(blocksData: CreateContentBlockDto[]): Promise<ContentBlock[]> {
    if (!blocksData || !Array.isArray(blocksData)) {
      throw new BadRequestException('Se esperaba un array de bloques de contenido');
    }

    const validBlocksData = blocksData.filter(data => 
      data.page && data.section && data.block_key
    );

    return this.contentBlockRepository.manager.transaction(async (entityManager) => {
      return Promise.all(validBlocksData.map(async (data) => {
        const existing = await entityManager.findOne(ContentBlock, {
          where: {
            page: data.page,
            section: data.section,
            block_key: data.block_key
          }
        });

        if (existing) {
          Object.assign(existing, data);
          return entityManager.save(existing);
        }
        
        const newBlock = entityManager.create(ContentBlock, data);
        return entityManager.save(newBlock);
      }));
    });
  }

  //Helper function to validate the structure of the content
  private mapBlocksToSlim(blocks: ContentBlock[]): Record<string, Record<string, string | null>> {
      const out: Record<string, Record<string, string | null>> = {};
      for (const b of blocks) {
          if (!out[b.section]) out[b.section] = {};
          out[b.section][b.block_key] = b.text_content ?? b.image_url ?? null;
        } 
      return out;
  }


}
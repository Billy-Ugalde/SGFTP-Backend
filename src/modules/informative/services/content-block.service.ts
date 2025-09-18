import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
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
  try {
    const newBlock = this.contentBlockRepository.create(createDto);
    return await this.contentBlockRepository.save(newBlock);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23000') {
      throw new ConflictException(
        `Ya existe un bloque con page: ${createDto.page}, section: ${createDto.section}, block_key: ${createDto.block_key}`
      );
    }
    throw error;
  }
}

  async updateByNaturalKey(page: string, section: string, block_key: string, 
                            updateDto: UpdateContentBlockDto): Promise<ContentBlock> {
    // Buscar el bloque por sus identificadores page, section y block_key
    const block = await this.contentBlockRepository.findOne({
      where: { page, section, block_key }
    });

    if (!block) {
      throw new NotFoundException(
        `ContentBlock no encontrado para page: ${page}, section: ${section}, block_key: ${block_key}`
      );
    }

    // Actualizar solo los campos proporcionados
    if (updateDto.text_content !== undefined) {
      block.text_content = updateDto.text_content;
    }
    
    if (updateDto.image_url !== undefined) {
      block.image_url = updateDto.image_url;
    }

    return this.contentBlockRepository.save(block);
  }

  // === ADICIÓN (nuevo método público de upsert por clave natural) =========================
  /**
   * Upsert por claves naturales (page/section/block_key).
   * - Si existe: actualiza sólo los campos provistos en updateDto.
   * - Si no existe: crea el bloque con esos campos.
   *
   * Úsalo desde el controlador del PATCH/PUT para evitar 404 en claves nuevas.
   */
  async updateOrCreateByNaturalKey(
    page: string,
    section: string,
    block_key: string,
    updateDto: UpdateContentBlockDto,
  ): Promise<ContentBlock> {
    const createLikeDto: CreateContentBlockDto = {
      page,
      section,
      block_key,
      ...(updateDto.text_content !== undefined ? { text_content: updateDto.text_content } : {}),
      ...(updateDto.image_url !== undefined ? { image_url: updateDto.image_url } : {}),
    };
    return this.upsertByNaturalKey(createLikeDto);
  }
  // ========================================================================================

  // Método para obtener por identificador natural
  async findByNaturalKey(page: string, section: string, block_key: string): Promise<ContentBlock> {
    const block = await this.contentBlockRepository.findOne({
      where: { page, section, block_key }
    });

    if (!block) {
      throw new NotFoundException(
        `ContentBlock no encontrado: ${page}/${section}/${block_key}`
      );
    }

    return block;
  }

  async remove(id: number): Promise<void> {
    const result = await this.contentBlockRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`ContentBlock con ID ${id} no encontrado`);
    }
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
  /**async updateOrCreateBatch(blocksData: CreateContentBlockDto[]): Promise<ContentBlock[]> {
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
  } */
  
  async updateOrCreateBatch(blocksData: CreateContentBlockDto[]): Promise<ContentBlock[]> {
  if (!blocksData || !Array.isArray(blocksData)) {
    throw new BadRequestException('Se esperaba un array de bloques de contenido');
  }

  const results: ContentBlock[] = [];
  
  for (const data of blocksData) {
    // Validar que tenga los campos mínimos
    if (!data.page || !data.section || !data.block_key) {
      console.warn('Bloque ignorado por falta de campos requeridos:', data);
      continue;
    }

    try {
      // Usar el método de upsert por claves naturales
      const result = await this.upsertByNaturalKey(data);
      results.push(result);
    } catch (error) {
      console.error('Error procesando bloque:', data, error);
    }
  }
  
  return results;
}

private async upsertByNaturalKey(createOrUpdateDto: CreateContentBlockDto): Promise<ContentBlock> {
  const { page, section, block_key } = createOrUpdateDto;
  
  // Buscar bloque existente
  const existing = await this.contentBlockRepository.findOne({
    where: { page, section, block_key }
  });

  if (existing) {
    // Actualizar bloque existente
    if (createOrUpdateDto.text_content !== undefined) {
      existing.text_content = createOrUpdateDto.text_content;
    }
    if (createOrUpdateDto.image_url !== undefined) {
      existing.image_url = createOrUpdateDto.image_url;
    }
    return this.contentBlockRepository.save(existing);
  } else {
    // Crear nuevo bloque
    const newBlock = this.contentBlockRepository.create(createOrUpdateDto);
    return this.contentBlockRepository.save(newBlock);
  }
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

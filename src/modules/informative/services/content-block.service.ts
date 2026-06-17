import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentBlock } from '../entities/content-block.entity';
import { CreateContentBlockDto } from '../dto/create-content-block.dto';
import { UpdateContentBlockDto } from '../dto/update-content-block.dto';
import { StructuredContentDto } from '../dto/structured-content.dto';
import { GoogleDriveService } from '../../google-drive/google-drive.service';
import { validateAndProcessImage } from 'src/common/utils/image-processor';

@Injectable()
export class ContentBlockService {
  constructor(
    @InjectRepository(ContentBlock)
    private readonly contentBlockRepository: Repository<ContentBlock>,
    private readonly googleDriveService: GoogleDriveService,
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

  async updateByNaturalKey(
    page: string, 
    section: string, 
    block_key: string, 
    updateDto: UpdateContentBlockDto
  ): Promise<ContentBlock> {
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
    // Buscar bloque existente
    const existing = await this.contentBlockRepository.findOne({
      where: { page, section, block_key }
    });

    if (existing) {
      // Si existe, ACTUALIZAR los campos proporcionados
      if (updateDto.text_content !== undefined) {
        existing.text_content = updateDto.text_content;
      }
      if (updateDto.image_url !== undefined) {
        existing.image_url = updateDto.image_url;
      }
      return await this.contentBlockRepository.save(existing);
    } else {
      // Si no existe, CREAR nuevo
      const newBlock = this.contentBlockRepository.create({
        page,
        section,
        block_key,
        text_content: updateDto.text_content || '',
        image_url: updateDto.image_url || '',
      });
      return await this.contentBlockRepository.save(newBlock);
    }
  }

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

  async findByPageAndSection(page: string, section: string): Promise<Record<string, string | null>> {
    const blocks = await this.contentBlockRepository.find({ where: { page, section } });
    const out: Record<string, string | null> = {};
    
    for (const b of blocks) {
      // Obtener valores y hacer trim para verificar si tienen contenido real
      const textValue = b.text_content?.trim() || '';
      const imageValue = b.image_url?.trim() || '';
      
      // Priorizar el valor que tenga contenido real (no vacío)
      if (textValue.length > 0) {
        out[b.block_key] = textValue;
      } else if (imageValue.length > 0) {
        out[b.block_key] = imageValue;
      } else {
        out[b.block_key] = null;
      }
    }
    
    return out;
  }

  async getPageContent(page: string): Promise<Record<string, Record<string, string | null>>> {
    const blocks = await this.contentBlockRepository.find({ where: { page } });
    return this.mapBlocksToSlim(blocks);
  }
  
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
      // Si el bloque ya existe, NO actualizamos nada (preservar datos existentes)
      // Esto previene que el seeder sobrescriba contenido editado manualmente
      //console.log(`ℹ️  Block ${page}/${section}/${block_key} already exists, skipping update`);
      return existing;
    } else {
      // Crear nuevo bloque solo si no existe
      const newBlock = this.contentBlockRepository.create(createOrUpdateDto);
      const saved = await this.contentBlockRepository.save(newBlock);
      //console.log(`✅ Created new block: ${page}/${section}/${block_key}`);
      return saved;
    }
  }

  // Helper function to validate the structure of the content
  private mapBlocksToSlim(blocks: ContentBlock[]): Record<string, Record<string, string | null>> {
    const out: Record<string, Record<string, string | null>> = {};
    
    for (const b of blocks) {
      if (!out[b.section]) out[b.section] = {};
      
      // Usar la misma lógica que findByPageAndSection
      const textValue = b.text_content?.trim() || '';
      const imageValue = b.image_url?.trim() || '';
      
      if (textValue.length > 0) {
        out[b.section][b.block_key] = textValue;
      } else if (imageValue.length > 0) {
        out[b.section][b.block_key] = imageValue;
      } else {
        out[b.section][b.block_key] = null;
      }
    }
    
    return out;
  }

  // ==========================================
  // MÉTODOS PARA MANEJO DE IMÁGENES
  // ==========================================

  /**
   * Actualiza la imagen de fondo del hero
   */
  async updateHeroBackground(file: Express.Multer.File): Promise<ContentBlock> {
    // 1. Buscar el content block del hero background
    const heroBlock = await this.contentBlockRepository.findOne({
      where: { 
        page: 'home', 
        section: 'hero', 
        block_key: 'background' 
      }
    });

    if (!heroBlock) {
      throw new NotFoundException('No se encontró el bloque de fondo del hero');
    }

    // 2. Si ya existe una imagen, eliminarla de Google Drive
    if (heroBlock.image_url) {
      const oldFileId = this.googleDriveService.extractFileIdFromUrl(heroBlock.image_url);
      if (oldFileId) {
        await this.googleDriveService.deleteFile(oldFileId);
      }
    }

    // 3. Validar y procesar la imagen (magic bytes + Sharp → WebP)
    const processedFile = await validateAndProcessImage(file, { maxWidthPx: 1920, quality: 88 });

    // 4. Subir la imagen procesada a Google Drive
    const uploadResult = await this.googleDriveService.uploadFile(processedFile, 'hero');

    // 5. Actualizar el content block con la nueva URL
    heroBlock.image_url = uploadResult.url;
    heroBlock.text_content = ''; // Limpiar text_content si existía

    return this.contentBlockRepository.save(heroBlock);
  }

  /**
   * Actualiza la foto de un miembro de la junta
   * @param role - El rol del miembro (president, vice_president, secretary, treasurer, director, administrator)
   */
  async updateBoardMemberPhoto(role: string, file: Express.Multer.File): Promise<ContentBlock> {
    console.log('🔍 Iniciando updateBoardMemberPhoto');
  console.log('📋 Role recibido:', role);
  console.log('📁 File recibido:', file ? 'Sí' : 'No');
    // Validar que el rol sea válido
    const validRoles = ['president', 'vice_president', 'secretary', 'treasurer', 'director', 'administrator'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(
        `Rol inválido. Debe ser uno de: ${validRoles.join(', ')}`
      );
    }

    // 1. Buscar el content block de la foto del miembro
    const photoBlockKey = `${role}_photo`;
  console.log('🔑 Buscando block_key:', photoBlockKey);
    const memberPhotoBlock = await this.contentBlockRepository.findOne({
      where: { 
        page: 'home', 
        section: 'board_members', 
        block_key: photoBlockKey 
      }
    });

    if (!memberPhotoBlock) {
      throw new NotFoundException(
        `No se encontró el bloque de foto para el rol: ${role}`
      );
    }

    console.log('✅ Block encontrado:', memberPhotoBlock.id);
    // 2. Si ya existe una imagen, eliminarla de Google Drive

    if (memberPhotoBlock.image_url) {
      const oldFileId = this.googleDriveService.extractFileIdFromUrl(memberPhotoBlock.image_url);
      if (oldFileId) {
        await this.googleDriveService.deleteFile(oldFileId);
      }
    }

    console.log('📤 Procesando y subiendo nueva imagen a Google Drive...');
    try {
      // Validar y procesar la imagen (magic bytes + Sharp → WebP)
      const processedFile = await validateAndProcessImage(file, { maxWidthPx: 1000, quality: 85 });
      const uploadResult = await this.googleDriveService.uploadFile(processedFile, 'board_members');
      console.log('✅ Imagen subida exitosamente:', uploadResult);
      
      // 4. Actualizar el content block con la nueva URL
      memberPhotoBlock.image_url = uploadResult.url;
      memberPhotoBlock.text_content = ''; // Limpiar text_content si existía

      const saved = await this.contentBlockRepository.save(memberPhotoBlock);
      console.log('💾 Block guardado:', saved);
      
      return saved;
    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      throw error;
    }
  }

  /**
   * Sube una imagen a Google Drive y actualiza el content block
   */
  async uploadImageToBlock(
    page: string, 
    section: string, 
    block_key: string, 
    file: Express.Multer.File
  ): Promise<ContentBlock> {
    console.log('🔍 Buscando bloque:', page, section, block_key);
    
    // 1. Buscar el content block
    let block = await this.contentBlockRepository.findOne({
      where: { page, section, block_key }
    });

    // 2. Si no existe, crearlo
    if (!block) {
      console.log('⚠️ Bloque no existe, creándolo...');
      block = this.contentBlockRepository.create({
        page,
        section,
        block_key,
        text_content: '',
        image_url: ''
      });
      block = await this.contentBlockRepository.save(block);
    }

    console.log('✅ Bloque encontrado/creado:', block.id);

    // 3. Si ya existe una imagen, eliminarla de Google Drive
    if (block.image_url) {
      console.log('🗑️ Eliminando imagen anterior:', block.image_url);
      const oldFileId = this.googleDriveService.extractFileIdFromUrl(block.image_url);
      if (oldFileId) {
        await this.googleDriveService.deleteFile(oldFileId);
      }
    }

    // 4. Validar, procesar y subir la imagen
    console.log('📤 Procesando y subiendo nueva imagen...');
    const processedFile = await validateAndProcessImage(file, { maxWidthPx: 1200, quality: 85 });
    const uploadResult = await this.googleDriveService.uploadFile(processedFile, section);
    console.log('✅ Imagen subida:', uploadResult.url);

    // 5. Actualizar el content block con la nueva URL
    block.image_url = uploadResult.url;
    block.text_content = '';

    const saved = await this.contentBlockRepository.save(block);
    console.log('💾 Guardado en BD:', saved);
    
    return saved;
  }
}
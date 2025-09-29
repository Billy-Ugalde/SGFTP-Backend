// news.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { News } from './entities/news.entity';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsStatusDto } from './dto/news-status.dto'; 
import { CreateNewsDto } from './dto/create-news.dto';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Injectable()
export class NewsService {
    constructor(
        @InjectRepository(News)
        private readonly newsRepository: Repository<News>,
        private readonly googleDriveService: GoogleDriveService,
        private readonly dataSource: DataSource,
    ) {}      

    async create(createNewsDto: CreateNewsDto, file?: Express.Multer.File): Promise<News> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let imageUrl: string | undefined;
            
            // 🚀 Subir archivo a Drive si existe
            if (file) {
                console.log('📤 Subiendo imagen a Google Drive...');
                const timestamp = Date.now();
                const folderName = `news_temp_${timestamp}`;
                
                const { url } = await this.googleDriveService.uploadFile(file, folderName);
                imageUrl = url;
                console.log('✅ Imagen subida exitosamente:', imageUrl);
            }

            // Crear la noticia con la URL generada
            const newNews = this.newsRepository.create({
                ...createNewsDto,
                image_url: imageUrl,
            });

            const savedNews = await queryRunner.manager.save(News, newNews);
            console.log('✅ Noticia creada con ID:', savedNews.id_news);

            await queryRunner.commitTransaction();
            return savedNews;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('❌ Error creando noticia:', error);
            throw new InternalServerErrorException(
                `Error creando noticia: ${error.message || 'Error desconocido'}`
            );
        } finally {
            await queryRunner.release();
        }
    }

    async getAll(): Promise<News[]> {
        return this.newsRepository.find({
            order: { publicationDate: 'DESC' }
        });
    }       

    async getOne(id_news: number): Promise<News> {
        const news = await this.newsRepository.findOne({ 
            where: { id_news } 
        });
    
        if (!news) {
            throw new NotFoundException(`La noticia con ID ${id_news} no existe`);
        }
        
        return news;
    }

    async update(id_news: number, dto: UpdateNewsDto, file?: Express.Multer.File): Promise<News> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const news = await this.getOne(id_news);
            let fileToDelete: string | null = null;

            // Manejar reemplazo de imagen
            if (file) {
                console.log('🔄 Procesando reemplazo de imagen');
                const folderName = `news_${news.id_news}`;
                
                // 1. Marcar archivo anterior para eliminación si existe
                if (news.image_url && news.image_url.trim() !== '') {
                    const fileId = this.googleDriveService.extractFileIdFromUrl(news.image_url);
                    if (fileId) {
                        fileToDelete = fileId;
                        console.log('🗑️ Imagen anterior marcada para eliminación:', fileId);
                    }
                }
                
                // 2. Subir nueva imagen
                try {
                    console.log('⬆️ Subiendo nueva imagen a Google Drive...');
                    const { url } = await this.googleDriveService.uploadFile(file, folderName);
                    dto.image_url = url;
                    console.log('✅ Nueva imagen subida:', url);
                } catch (uploadError) {
                    console.error('❌ Error subiendo imagen:', uploadError);
                    throw new InternalServerErrorException(
                        `Error subiendo imagen: ${uploadError.message || 'Error desconocido'}`
                    );
                }
            } else if (dto.image_url && dto.image_url.startsWith('__FILE_REPLACE_')) {
                // Limpiar marcador si no hay archivo
                delete dto.image_url;
            }

            // Actualizar datos de la noticia
            const updated = Object.assign(news, dto);
            const savedNews = await queryRunner.manager.save(News, updated);

            await queryRunner.commitTransaction();
            console.log('✅ Noticia actualizada exitosamente');

            // Eliminar imagen antigua DESPUÉS del commit exitoso
            if (fileToDelete) {
                console.log('🗑️ Iniciando eliminación de imagen antigua');
                this.googleDriveService.deleteFile(fileToDelete)
                    .then(() => console.log('✅ Imagen antigua eliminada'))
                    .catch(error => console.error('⚠️ No se pudo eliminar imagen antigua:', error.message));
            }

            return savedNews;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('❌ Error actualizando noticia:', error);
            
            if (error instanceof InternalServerErrorException) {
                throw error;
            }
            
            throw new InternalServerErrorException(
                `Error actualizando noticia: ${error.message || 'Error desconocido'}`
            );
        } finally {
            await queryRunner.release();
        }
    }

    async updateStatus(id_news: number, { status }: NewsStatusDto): Promise<News> {
        const news = await this.getOne(id_news);
        news.status = status;
        return this.newsRepository.save(news);
    }

    async delete(id_news: number): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const news = await this.newsRepository.findOne({ where: { id_news } });
            
            if (!news) {
                throw new NotFoundException(`La noticia con ID ${id_news} no existe`);
            }

            // Eliminar imagen de Google Drive si existe
            if (news.image_url && news.image_url.trim() !== '') {
                const fileId = this.googleDriveService.extractFileIdFromUrl(news.image_url);
                if (fileId) {
                    console.log('🗑️ Eliminando imagen de Google Drive:', fileId);
                    await this.googleDriveService.deleteFile(fileId);
                    console.log('✅ Imagen eliminada de Google Drive');
                }
            }

            await queryRunner.manager.delete(News, id_news);
            await queryRunner.commitTransaction();
            console.log('✅ Noticia eliminada exitosamente');

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('❌ Error eliminando noticia:', error);
            throw new InternalServerErrorException(
                `Error eliminando noticia: ${error.message || 'Error desconocido'}`
            );
        } finally {
            await queryRunner.release();
        }
    }
}
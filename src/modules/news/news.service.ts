// news.service.ts
import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { News, NewsStatus } from './entities/news.entity';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsStatusDto } from './dto/news-status.dto'; 
import { CreateNewsDto } from './dto/create-news.dto';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { validateAndProcessImage } from 'src/common/utils/image-processor';

@Injectable()
export class NewsService {
    constructor(
        @InjectRepository(News)
        private readonly newsRepository: Repository<News>,
        private readonly googleDriveService: GoogleDriveService,
        private readonly dataSource: DataSource,
    ) {}      

    async create(createNewsDto: CreateNewsDto, file?: Express.Multer.File): Promise<News> {
        // Validar y optimizar la imagen ANTES de tocar la base de datos.
        // Si el archivo no es una imagen válida, lanza 400 sin crear la noticia.
        if (file) file = await validateAndProcessImage(file);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1️⃣ PRIMERO crear la noticia sin imagen
            const newNews = this.newsRepository.create({
                ...createNewsDto,
                // image_url se establecerá después
            });

            const savedNews = await queryRunner.manager.save(News, newNews);
            console.log('✅ Noticia creada con ID:', savedNews.id_news);

            let imageUrl: string | undefined;

            // 2️⃣ LUEGO subir imagen con el ID real
            if (file) {
                console.log('📤 Subiendo imagen a Google Drive...');
                const folderName = `news_${savedNews.id_news}`;
                
                const { url } = await this.googleDriveService.uploadFile(file, folderName);
                imageUrl = url;
                console.log('✅ Imagen subida exitosamente:', imageUrl);

                // 3️⃣ ACTUALIZAR la noticia con la URL de la imagen
                savedNews.image_url = imageUrl;
                await queryRunner.manager.save(News, savedNews);
            }

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
            order: { createdAt: 'DESC' }
        });
    } 
    
    async getAllPublished(): Promise<News[]> {
        return await this.newsRepository.find({
        where: {
            status: NewsStatus.PUBLISHED
        },
        order: {
            publicationDate: 'DESC'
        }
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
        // Validar y optimizar la imagen de reemplazo antes de abrir la transacción.
        if (file) file = await validateAndProcessImage(file);

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

        if (status === NewsStatus.PUBLISHED && !news.image_url?.trim()) {
            throw new BadRequestException(
                'No se puede publicar una noticia sin imagen. Agrega una imagen antes de publicar.'
            );
        }

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

            const fileIdToDelete = (news.image_url && news.image_url.trim() !== '')
                ? this.googleDriveService.extractFileIdFromUrl(news.image_url)
                : null;

            await queryRunner.manager.delete(News, id_news);
            await queryRunner.commitTransaction();
            console.log('✅ Noticia eliminada exitosamente');

            // Eliminar imagen de Drive después del commit (fire-and-forget)
            if (fileIdToDelete) {
                this.googleDriveService.deleteFile(fileIdToDelete)
                    .then(() => console.log('✅ Imagen eliminada de Google Drive'))
                    .catch(error => console.error('⚠️ No se pudo eliminar imagen de Drive:', error.message));
            }

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
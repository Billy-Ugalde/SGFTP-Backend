import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsStatusDto } from './dto/news-status.dto'; 
import { CreateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService {
    constructor(
        @InjectRepository(News)
        private readonly newsRepository: Repository<News>,
    ) {}      

    async create(createNewsDto: CreateNewsDto): Promise<News> {
        const newNews = this.newsRepository.create(createNewsDto);
        return this.newsRepository.save(newNews);
    }

    async getAll(): Promise<News[]> {
        return this.newsRepository.find({
            order: { publicationDate: 'DESC' } // Ordenar por fecha más reciente
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

    async update(id_news: number, dto: UpdateNewsDto): Promise<News> {
        const news = await this.getOne(id_news);
        const updated = Object.assign(news, dto);
        return this.newsRepository.save(updated);
    }

    async updateStatus(id_news: number, { status }: NewsStatusDto): Promise<News> {
        const news = await this.getOne(id_news);
        news.status = status;
        return this.newsRepository.save(news);
    }

    // news.service.ts
    async delete(id_news: number): Promise<void> {
        const news = await this.newsRepository.findOne({ where: { id_news } });
        
        if (!news) {
            throw new NotFoundException(`La noticia con ID ${id_news} no existe`);
        }
        
        await this.newsRepository.delete(id_news);
    }
}
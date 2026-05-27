import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { NewsStatus } from '../entities/news.entity';

export class CreateNewsDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsNotEmpty()
    @IsString()
    author: string;

    @IsOptional()
    @IsEnum(NewsStatus)
    status?: NewsStatus;
}

    
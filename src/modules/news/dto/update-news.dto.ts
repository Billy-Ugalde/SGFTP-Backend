import { IsString, IsOptional, IsUrl, IsEnum, MaxLength} from 'class-validator'
import { NewsStatus } from '../entities/news.entity';

export class UpdateNewsDto {
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'El título no puede exceder los 100 caracteres' })
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000, { message: 'El contenido no puede exceder los 2000 caracteres' })
    content?: string;

    @IsOptional()
    @IsUrl()
    image_url?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'El autor no puede exceder los 100 caracteres' })
    author?: string;

    @IsOptional()
    @IsEnum(NewsStatus)
    status?: NewsStatus;
}
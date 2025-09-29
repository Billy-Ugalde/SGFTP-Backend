import { IsString, IsOptional, IsUrl, IsEnum} from 'class-validator'
import { NewsStatus } from '../entities/news.entity';

export class UpdateNewsDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string; 

    @IsOptional()
    @IsUrl()
    image_url?: string;    

    @IsOptional()
    @IsString()
    author?: string; 

    @IsOptional()
    @IsEnum(NewsStatus)
    status?: NewsStatus;
}
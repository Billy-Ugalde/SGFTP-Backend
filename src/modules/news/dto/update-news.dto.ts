import { IsString, IsOptional, IsUrl} from 'class-validator'

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
}
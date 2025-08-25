import { IsString, IsOptional} from 'class-validator'

export class UpdateNewsDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    content?: string; 

    @IsOptional()
    @IsString()
    image_url?: string;    

    @IsOptional()
    @IsString()
    author?: string; 
}
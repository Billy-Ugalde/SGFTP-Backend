import { IsNotEmpty, IsString, IsUrl, IsBoolean, IsOptional} from 'class-validator';

export class CreateNewsDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    content: string;            

    @IsNotEmpty()
    @IsUrl()
    image_url: string;   

    @IsNotEmpty()
    @IsString()
    author: string; 
}

    
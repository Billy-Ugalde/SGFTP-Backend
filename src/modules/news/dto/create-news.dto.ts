import { IsNotEmpty, IsString, IsUrl, IsBoolean, IsOptional, MaxLength} from 'class-validator';

export class CreateNewsDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(100, { message: 'El título no puede exceder los 100 caracteres' })
    title: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(2000, { message: 'El contenido no puede exceder los 2000 caracteres' })
    content: string;

    @IsNotEmpty()
    @IsUrl()
    image_url: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(100, { message: 'El autor no puede exceder los 100 caracteres' })
    author: string;
}

    
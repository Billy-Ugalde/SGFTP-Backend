import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateContentBlockDto {
  @IsString()
  @IsOptional()
  text_content?: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}
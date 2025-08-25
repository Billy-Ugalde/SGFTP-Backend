import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateContentBlockDto {
  @IsString()
  @IsNotEmpty()
  page: string;

  @IsString()
  @IsNotEmpty()
  section: string;

  @IsString()
  @IsNotEmpty()
  block_key: string;

  @IsString()
  @IsOptional()
  text_content?: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}
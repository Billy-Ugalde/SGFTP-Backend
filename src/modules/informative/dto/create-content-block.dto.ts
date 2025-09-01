import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

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

  @IsUrl()
  @IsOptional()
  image_url?: string;
}
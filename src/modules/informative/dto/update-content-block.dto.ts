import { IsString, IsUrl, IsOptional } from 'class-validator';

export class UpdateContentBlockDto {
  @IsString()
  @IsOptional()
  text_content?: string;

  @IsUrl()
  @IsOptional()
  image_url?: string;
}
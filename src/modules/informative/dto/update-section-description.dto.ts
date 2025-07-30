import { IsString, IsOptional } from 'class-validator';

export class UpdateSectionDescriptionDto {
  @IsString()
  id: string; // e.g. "news_section"

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

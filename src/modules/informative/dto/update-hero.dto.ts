import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateHeroDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  backgroundImage?: string;
}

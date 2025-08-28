import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { EntrepreneurshipCategory, EntrepreneurshipApproach } from '../entities/entrepreneurship.entity';

export class CreateEntrepreneurshipDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(EntrepreneurshipCategory)
  @IsNotEmpty()
  category: EntrepreneurshipCategory;

  @IsEnum(EntrepreneurshipApproach)
  @IsNotEmpty()
  approach: EntrepreneurshipApproach;

  @IsString()
  @IsNotEmpty()
  url_1?: string;

  @IsString()
  @IsNotEmpty()
  url_2?: string;

  @IsString()
  @IsNotEmpty()
  url_3?: string;
}

export class UpdateEntrepreneurshipDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(EntrepreneurshipCategory)
  @IsOptional()
  category?: EntrepreneurshipCategory;

  @IsEnum(EntrepreneurshipApproach)
  @IsOptional()
  approach?: EntrepreneurshipApproach;

  @IsString()
  @IsOptional()
  url_1?: string;

  @IsString()
  @IsOptional()
  url_2?: string;

  @IsString()
  @IsOptional()
  url_3?: string;
}
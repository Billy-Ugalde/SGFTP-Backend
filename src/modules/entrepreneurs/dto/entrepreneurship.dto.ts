import { IsString, IsEnum, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { EntrepreneurshipCategory, EntrepreneurshipApproach } from '../entities/entrepreneurship.entity';

export class CreateEntrepreneurshipDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
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
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
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
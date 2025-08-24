import { IsString, IsEmail, IsEnum, IsNumber, IsOptional, IsNotEmpty, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { EntrepreneurStatus } from '../entities/entrepreneur.entity';
import { EntrepreneurshipCategory, EntrepreneurshipApproach } from '../entities/entrepreneurship.entity';

export class CreateEntrepreneurDto {
  // Person data
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsOptional()
  second_name?: string;

  @IsString()
  @IsNotEmpty()
  first_lastname: string;

  @IsString()
  @IsNotEmpty()
  second_lastname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos' })
  phone_number: string;

  // Entrepreneur data
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  experience: number;

  // Entrepreneurship data
  @IsString()
  @IsNotEmpty()
  entrepreneurship_name: string;

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
  @IsOptional()
  url_1?: string;

  @IsString()
  @IsOptional()
  url_2?: string;

  @IsString()
  @IsOptional()
  url_3?: string;
}

export class UpdateEntrepreneurDto {
  // Person data
  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  second_name?: string;

  @IsString()
  @IsOptional()
  first_lastname?: string;

  @IsString()
  @IsOptional()
  second_lastname?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos' })
  phone_number?: string;

  // Entrepreneur data
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @IsOptional()
  experience?: number;

  // Entrepreneurship data
  @IsString()
  @IsOptional()
  entrepreneurship_name?: string;

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

export class UpdateStatusDto {
  @IsEnum(EntrepreneurStatus)
  @IsNotEmpty()
  status: EntrepreneurStatus;
}

export class ToggleActiveDto {
  @IsNotEmpty()
  active: boolean;
}
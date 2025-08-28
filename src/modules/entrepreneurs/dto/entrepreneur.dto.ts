import {IsEnum, IsNumber, IsOptional, IsNotEmpty, Min, Max, IsBoolean, IsString, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { EntrepreneurStatus } from '../entities/entrepreneur.entity';


export class CreateEntrepreneurDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  experience: number;

  @IsString()
  @IsUrl({}, { message: 'Debe ser una URL válida de Facebook' })
  @IsOptional()
  facebook_url?: string;

  @IsString()
  @IsUrl({}, { message: 'Debe ser una URL válida de Instagram' })
  @IsOptional()
  instagram_url?: string;

}

export class UpdateEntrepreneurDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @IsOptional()
  experience?: number;

  @IsString()
  @IsUrl({}, { message: 'Debe ser una URL válida de Facebook' })
  @IsOptional()
  facebook_url?: string;

  @IsString()
  @IsUrl({}, { message: 'Debe ser una URL válida de Instagram' })
  @IsOptional()
  instagram_url?: string;
}

export class UpdateStatusDto {
  @IsEnum(EntrepreneurStatus)
  @IsNotEmpty()
  status: EntrepreneurStatus;
}

export class ToggleActiveDto {
  @IsBoolean()
  @IsNotEmpty()
  active: boolean;
}
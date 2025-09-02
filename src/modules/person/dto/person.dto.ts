import { IsString, IsEmail, IsNotEmpty, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePhoneDto, UpdatePhoneDto } from './phone.dto';

export class CreatePersonDto {
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

  @ValidateNested({ each: true })
  @Type(() => CreatePhoneDto)
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un número telefónico' })
  phones: CreatePhoneDto[];
}

export class UpdatePersonDto {
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

  @ValidateNested({ each: true })
  @Type(() => UpdatePhoneDto)
  @IsOptional()
  phones?: UpdatePhoneDto[];
}
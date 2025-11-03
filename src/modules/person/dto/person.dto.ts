import { IsString, IsEmail, IsNotEmpty, IsOptional, Matches } from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos en el teléfono principal' })
  phone_primary: string;

  @IsString()
  @IsOptional()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos en el teléfono secundario' })
  phone_secondary?: string;
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

  @IsString()
  @IsOptional()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos en el teléfono principal' })
  phone_primary?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos en el teléfono secundario' })
  phone_secondary?: string;
}
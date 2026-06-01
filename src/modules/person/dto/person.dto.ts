import { IsString, IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { IsValidPhone } from '../../../common/phone/IsValidPhone.decorator';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  second_name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  first_lastname: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  second_lastname: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @IsNotEmpty()
  @IsValidPhone()
  phone_primary: string;

  @IsOptional()
  @IsValidPhone()
  phone_secondary?: string;
}

export class UpdatePersonDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  first_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  second_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  first_lastname?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  second_lastname?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsValidPhone()
  phone_primary?: string;

  @IsOptional()
  @IsValidPhone()
  phone_secondary?: string;
}

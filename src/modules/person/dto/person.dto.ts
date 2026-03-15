import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { IsValidPhone } from '../../../common/phone/IsValidPhone.decorator';

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

  @IsOptional()
  @IsValidPhone()
  phone_primary?: string;

  @IsOptional()
  @IsValidPhone()
  phone_secondary?: string;
}

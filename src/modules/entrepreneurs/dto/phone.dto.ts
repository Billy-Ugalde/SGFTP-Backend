import { IsString, IsEnum, IsBoolean, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { PhoneType } from '../../../entities/phone.entity';

export class CreatePhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos' })
  number: string;

  @IsEnum(PhoneType)
  @IsOptional()
  type?: PhoneType = PhoneType.PERSONAL;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean = false;
}

export class UpdatePhoneDto {
  @IsString()
  @IsOptional()
  @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos' })
  number?: string;

  @IsEnum(PhoneType)
  @IsOptional()
  type?: PhoneType;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}
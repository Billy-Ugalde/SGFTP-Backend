import { IsEmail, IsOptional, IsString, IsEnum, MaxLength, MinLength } from 'class-validator';
import { DonationType, DonorInterest, ReadStatus } from '../enums/donor.enum';

export class UpdateDonorDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  first_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  second_name?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  first_lastname?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  second_lastname?: string;

  @IsEnum(DonationType)
  @IsOptional()
  Donation_type?: DonationType;

  @IsEnum(DonorInterest)
  @IsOptional()
  Interest?: DonorInterest;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(1000)
  Donation_details?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  Email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  @MaxLength(20)
  Phone?: string;

  @IsEnum(ReadStatus)
  @IsOptional()
  status?: ReadStatus;
}

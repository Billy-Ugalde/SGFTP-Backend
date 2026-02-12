import { IsEmail, IsNotEmpty, IsString, IsEnum, MaxLength, MinLength, IsOptional } from 'class-validator';
import { DonationType, DonorInterest } from '../enums/donor.enum';

export class CreateDonorDto {

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  first_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  second_name?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  first_lastname: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  second_lastname: string;

  @IsEnum(DonationType)
  @IsNotEmpty()
  Donation_type: DonationType;

  @IsEnum(DonorInterest)
  @IsNotEmpty()
  Interest: DonorInterest;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  Donation_details: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  Email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  Phone: string;
}

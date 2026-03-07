import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { DonationType } from '../enums/donation.enum';
import { DonorInterest, DonorType } from '../enums/donor.enum';

export class CreateDonationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  secondName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  nameCompany?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstLastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  secondLastName: string;

  @IsEnum(DonorType)
  @IsNotEmpty()
  donorType: DonorType;

  @IsEnum(DonorInterest)
  @IsNotEmpty()
  interest: DonorInterest;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @IsEnum(DonationType)
  @IsNotEmpty()
  donationType: DonationType;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  donationDetails: string;
}

import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { DonationType, DonationStatus } from '../enums/donation.enum';

export class UpdateDonationDto {
  @IsEnum(DonationType)
  @IsOptional()
  donationType?: DonationType;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(1000)
  donationDetails?: string;

  @IsEnum(DonationStatus)
  @IsOptional()
  status?: DonationStatus;
}

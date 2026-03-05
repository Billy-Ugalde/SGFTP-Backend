import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { DonationType, ReadStatus } from '../enums/donation.enum';

export class UpdateDonationDto {
  @IsEnum(DonationType)
  @IsOptional()
  Donation_type?: DonationType;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(1000)
  Donation_details?: string;

  @IsEnum(ReadStatus)
  @IsOptional()
  status?: ReadStatus;
}

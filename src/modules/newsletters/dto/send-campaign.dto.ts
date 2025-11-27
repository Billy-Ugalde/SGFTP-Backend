import { IsNotEmpty, IsString, MaxLength, IsEnum } from 'class-validator';
import { CampaignLanguage } from '../entities/newsletter-campaign.entity';

export class SendCampaignDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  subject: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsEnum(CampaignLanguage)
  language: CampaignLanguage;
}

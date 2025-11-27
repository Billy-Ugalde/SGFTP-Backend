import { IsEnum } from 'class-validator';
import { CampaignLanguage } from '../entities/newsletter-campaign.entity';

export class GetSubscribersDto {
  @IsEnum(CampaignLanguage)
  language: CampaignLanguage;
}

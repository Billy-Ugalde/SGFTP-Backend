import { IsOptional, IsString } from 'class-validator';

export class UpdateNewsletterDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  privacyNote?: string;
}

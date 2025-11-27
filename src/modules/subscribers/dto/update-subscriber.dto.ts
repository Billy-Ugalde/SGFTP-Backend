import { IsEmail, IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { PreferredLanguage } from '../entities/subscriber.entity';

export class UpdateSubscriberDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @IsEnum(PreferredLanguage)
  @IsOptional()
  preferredLanguage?: PreferredLanguage;
}
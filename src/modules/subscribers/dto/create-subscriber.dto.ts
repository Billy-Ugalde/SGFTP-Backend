
import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { PreferredLanguage } from '../entities/subscriber.entity';

export class CreateSubscriberDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  lastName: string;

  @IsEnum(PreferredLanguage)
  @IsOptional()
  preferredLanguage?: PreferredLanguage = PreferredLanguage.SPANISH;
}
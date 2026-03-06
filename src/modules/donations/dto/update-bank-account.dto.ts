import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrencyType } from '../enums/bank-account.enum';

export class UpdateBankAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bank_name?: string;

  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  account_number?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

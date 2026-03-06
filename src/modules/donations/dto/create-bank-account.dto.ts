import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CurrencyType } from '../enums/bank-account.enum';

export class CreateBankAccountDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  bank_name: string;

  @IsNotEmpty()
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  account_number: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

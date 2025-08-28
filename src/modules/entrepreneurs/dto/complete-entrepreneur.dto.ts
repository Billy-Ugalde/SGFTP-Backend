import { ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePersonDto, UpdatePersonDto } from './person.dto';
import { CreateEntrepreneurDto, UpdateEntrepreneurDto } from './entrepreneur.dto';
import { CreateEntrepreneurshipDto, UpdateEntrepreneurshipDto } from './entrepreneurship.dto';

export class CreateCompleteEntrepreneurDto {
  @ValidateNested()
  @Type(() => CreatePersonDto)
  @IsNotEmpty()
  person: CreatePersonDto;

  @ValidateNested()
  @Type(() => CreateEntrepreneurDto)
  @IsNotEmpty()
  entrepreneur: CreateEntrepreneurDto;

  @ValidateNested()
  @Type(() => CreateEntrepreneurshipDto)
  @IsNotEmpty()
  entrepreneurship: CreateEntrepreneurshipDto;
}

export class UpdateCompleteEntrepreneurDto {
  @ValidateNested()
  @Type(() => UpdatePersonDto)
  person?: UpdatePersonDto;

  @ValidateNested()
  @Type(() => UpdateEntrepreneurDto)
  entrepreneur?: UpdateEntrepreneurDto;

  @ValidateNested()
  @Type(() => UpdateEntrepreneurshipDto)
  entrepreneurship?: UpdateEntrepreneurshipDto;
}
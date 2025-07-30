import { IsString, IsOptional } from 'class-validator';

export class UpdateInvolveCardDto {
  @IsString()
  id: string; // e.g. "volunteer", "donation"

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;
}

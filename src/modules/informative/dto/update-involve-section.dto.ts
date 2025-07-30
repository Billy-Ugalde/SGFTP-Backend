import { IsOptional, IsString } from 'class-validator';

export class UpdateInvolveSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

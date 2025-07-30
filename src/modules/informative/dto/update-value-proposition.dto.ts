import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateValuePropositionDto {
  @IsOptional()
  @IsString()
  sectionTitle?: string;

  @IsOptional()
  @IsString()
  missionTitle?: string;

  @IsOptional()
  @IsString()
  missionContent?: string;

  @IsOptional()
  @IsString()
  visionTitle?: string;

  @IsOptional()
  @IsString()
  visionContent?: string;

  @IsOptional()
  @IsString()
  impactTitle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  impactTags?: string[];

  @IsOptional()
  @IsString()
  dimensionsTitle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dimensionsTags?: string[];
}

// src/modules/fairs/dto/report-fair.dto.ts
import { IsInt, Min, Max } from 'class-validator';

export class ReportFairDto {
  @IsInt()
  @Min(2000)
  year: number;

  @IsInt()
  @Min(1)
  @Max(4)
  quarter: 1 | 2 | 3 | 4;
}

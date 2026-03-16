import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction } from '../enums/audit.enum';

export class QueryAuditDto {
    @IsOptional()
    @IsString()
    entity?: string;

    @IsOptional()
    @IsEnum(AuditAction)
    action?: AuditAction;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    user_id?: number;

    @IsOptional()
    @IsString()
    date_from?: string;

    @IsOptional()
    @IsString()
    date_to?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}

import { IsNumber, IsOptional, IsString, Min, IsIn } from "class-validator";

export class UpdateMailboxDto {
    @IsString()
    @IsOptional()
    Organization?: string;

    @IsString()
    @IsOptional()
    Description?: string;

    @IsString()
    @IsOptional()
    Affair?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    Hour_volunteer?: number;

    // Acciones para cada documento
    @IsString()
    @IsIn(['keep', 'replace', 'delete', 'add'])
    @IsOptional()
    Document1_action?: string;

    @IsString()
    @IsIn(['keep', 'replace', 'delete', 'add'])
    @IsOptional()
    Document2_action?: string;

    @IsString()
    @IsIn(['keep', 'replace', 'delete', 'add'])
    @IsOptional()
    Document3_action?: string;
}
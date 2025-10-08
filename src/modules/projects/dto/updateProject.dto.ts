import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateProjectDto {
    @IsOptional()
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    Name: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    Description: string;

    @IsOptional()
    @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
    Observations: string;

    @IsOptional()
    @IsString({ message: 'El objetivo debe ser una cadena de texto' })
    Aim: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
    Start_date: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
    End_date?: string;

    @IsOptional()
    @IsString({ message: 'La población objetivo debe ser una cadena de texto' })
    Target_population: string;

    @IsOptional()
    @IsString({ message: 'La ubicación debe ser una cadena de texto' })
    Location: string;

    @IsOptional()
    @IsBoolean()
    Active: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El valor de la métrica debe ser un número entero' })
    @Min(0, { message: 'El valor de la métrica debe ser mayor o igual a 0' })
    METRIC_TOTAL_BENEFICIATED?: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El valor de la métrica debe ser un número entero' })
    @Min(0, { message: 'El valor de la métrica debe ser mayor o igual a 0' })
    METRIC_TOTAL_WASTE_COLLECTED?: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El valor de la métrica debe ser un número entero' })
    @Min(0, { message: 'El valor de la métrica debe ser mayor o igual a 0' })
    METRIC_TOTAL_TREES_PLANTED?: number = 0;
}
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateProjectDto {
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    Name: string;

    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    Description: string;

    @IsNotEmpty({ message: 'Las observaciones son obligatorias' })
    @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
    Observations: string;

    @IsNotEmpty({ message: 'El objetivo es obligatorio' })
    @IsString({ message: 'El objetivo debe ser una cadena de texto' })
    Aim: string;

    @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
    @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
    Start_date: string;

    @IsOptional()
    @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
    End_date?: string;

    @IsNotEmpty({ message: 'La población objetivo es obligatoria' })
    @IsString({ message: 'La población objetivo debe ser una cadena de texto' })
    Target_population: string;

    @IsNotEmpty({ message: 'La ubicación es obligatoria' })
    @IsString({ message: 'La ubicación debe ser una cadena de texto' })
    Location: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El valor de la métrica debe ser un número entero' })
    @Min(0, { message: 'El valor de la métrica debe ser mayor o igual a 0' })
    METRIC_TOTAL_BENEFICIATED: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El valor de la métrica debe ser un número entero' })
    @Min(0, { message: 'El valor de la métrica debe ser mayor o igual a 0' })
    METRIC_TOTAL_WASTE_COLLECTED: number = 0;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El valor de la métrica debe ser un número entero' })
    @Min(0, { message: 'El valor de la métrica debe ser mayor o igual a 0' })
    METRIC_TOTAL_TREES_PLANTED: number = 0;
}
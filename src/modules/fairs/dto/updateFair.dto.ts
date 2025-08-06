import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class UpdatefairDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsOptional()
    @IsNumber()
    stand_capacity?: number;
}
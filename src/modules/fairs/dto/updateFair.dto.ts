import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator"
import { TypetFair } from "../entities/fair.entity";

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

    @IsOptional()
    @IsNumber()
    stand_capacity?: number;

    @IsEnum(TypetFair)
    @IsOptional()
    typeFair: TypetFair;

    @IsDateString()
    @IsOptional()
    date?: string;
}
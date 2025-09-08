import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsString, Min } from "class-validator"
import { TypetFair } from "../entities/fair.entity";

export class fairDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    location: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    stand_capacity: number;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsEnum(TypetFair)
    @IsNotEmpty()
    typeFair: TypetFair;

    @IsNotEmpty()
    @IsBoolean()
    status: boolean
}
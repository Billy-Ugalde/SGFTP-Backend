import { IsBoolean, IsNotEmpty, IsNumber, IsString, Min } from "class-validator"

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

    @IsNotEmpty()
    @IsBoolean()
    status: boolean
}
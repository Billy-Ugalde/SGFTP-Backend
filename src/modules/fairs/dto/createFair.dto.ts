import { IsNotEmpty, IsNumber, IsString } from "class-validator"

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
    stand_capacity: number;
}
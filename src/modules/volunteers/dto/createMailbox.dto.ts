import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateMailboxDto {
    @IsString()
    @IsNotEmpty()
    Organization: string;

    @IsString()
    @IsNotEmpty()
    Description: string;

    @IsString()
    @IsNotEmpty()
    Affair: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    Hour_volunteer?: number;

    @IsNumber()
    @IsNotEmpty()
    Id_volunteer: number;
}
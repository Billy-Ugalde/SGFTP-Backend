import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator"

export class EnrollmentFairDto {

    @IsNumber()
    @IsNotEmpty()
    id_enrrolment_fair: number;

    @IsNumber()
    @IsNotEmpty()
    id_fair: number;

    @IsNumber()
    @IsNotEmpty()
    id_entrepenuer: number;

    @IsNumber()
    @IsNotEmpty()
    id_stand: number;

    @IsString()
    @IsNotEmpty()
    date: Date;

    @IsBoolean()
    status: boolean;


}
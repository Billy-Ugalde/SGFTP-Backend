import { IsNotEmpty, IsNumber } from "class-validator"
export class EnrollmentFairDto {

    @IsNumber()
    @IsNotEmpty()
    id_fair: number;

    @IsNumber()
    @IsNotEmpty()
    id_entrepreneur: number;

    @IsNumber()
    @IsNotEmpty()
    id_stand: number;
}
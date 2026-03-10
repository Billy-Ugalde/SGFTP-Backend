import { IsBoolean, IsNumber, IsOptional, ArrayMinSize, IsArray, IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { IsValidPhone } from '../../../common/phone/IsValidPhone.decorator';

export class CreateCompleteInvitationDto {
    // Datos de Person
    @IsString()
    first_name: string;

    @IsString()
    first_lastname: string;

    @IsString()
    second_lastname: string;

    @IsOptional()
    @IsString()
    second_name?: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsValidPhone()
    phone_primary: string;

    @IsOptional()
    @IsValidPhone()
    phone_secondary?: string;

    // Datos de User
    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(1)
    id_roles: number[];

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}

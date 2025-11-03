import { IsBoolean, IsNumber, IsOptional, ArrayMinSize, IsArray, IsString, IsEmail, Matches } from 'class-validator';

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

    @IsString()
    @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos en el teléfono principal' })
    phone_primary: string;

    @IsOptional()
    @IsString()
    @Matches(/^[\+]?[\d\s\-\(\)]+$/, { message: 'Solo números y el signo + son permitidos en el teléfono secundario' })
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
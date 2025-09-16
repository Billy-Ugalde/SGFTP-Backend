import { IsBoolean, IsNumber, IsOptional, ArrayMinSize, IsArray, IsString, IsEmail } from 'class-validator';
import { CreatePhoneDto } from "../../person/dto/phone.dto";

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
    
    @IsArray()
    phones: CreatePhoneDto[];
    
    // Datos de User
    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(1)
    id_roles: number[];
    
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
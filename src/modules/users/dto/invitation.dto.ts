import { IsBoolean, IsNumber, IsOptional, ArrayMinSize, IsArray } from 'class-validator';

export class CreateInvitationDto {
    @IsNumber()
    id_person: number;

    @IsArray()
    @IsNumber({}, { each: true })
    @ArrayMinSize(1, { message: 'Debe especificar al menos un rol' })
    id_roles: number[];

    @IsOptional()
    @IsBoolean()
    status?: boolean;
}
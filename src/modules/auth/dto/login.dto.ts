import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @IsString({ message: 'La contraseña debe ser texto' })
    @MinLength(1, { message: 'La contraseña es requerida' })
    password: string;
}
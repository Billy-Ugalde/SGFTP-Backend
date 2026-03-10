import { IsEmail, IsString, MinLength, Matches, IsOptional, IsNotEmpty } from 'class-validator';
import { IsValidPhone } from '../../../common/phone/IsValidPhone.decorator';

export class RegisterDto {
    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @IsString({ message: 'La contraseña debe ser texto' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        { message: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales' }
    )
    password: string;

    @IsString({ message: 'El nombre es requerido' })
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    first_name: string;

    @IsString({ message: 'El apellido es requerido' })
    @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
    first_lastname: string;

    @IsOptional()
    @IsString()
    second_name?: string;

    @IsOptional()
    @IsString()
    second_lastname?: string;

    @IsNotEmpty({ message: 'El teléfono principal no puede estar vacío' })
    @IsValidPhone({ message: 'El teléfono principal no es válido. Debe incluir el código de país (ej: +50688888888)' })
    phone_primary: string;

    @IsOptional()
    @IsValidPhone({ message: 'El teléfono secundario no es válido. Debe incluir el código de país (ej: +50688888888)' })
    phone_secondary?: string;
}

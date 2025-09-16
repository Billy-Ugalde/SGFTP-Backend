
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateUserDto {

    @IsOptional({ message: 'La contraseña es requerida' })
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    @IsString()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        { message: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales' }
    )
    password: string;

    @IsOptional({ message: 'El estado es obligatorio' })
    @IsBoolean()
    status: boolean

}

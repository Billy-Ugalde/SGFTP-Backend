
import { IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'El id_person es obligatorio' })
  @IsNumber({}, { message: 'El id_person debe ser numérico' })
  id_person: number;

  @IsNotEmpty({ message: 'El id_role es obligatorio' })
  @IsNumber({}, { message: 'El id_role debe ser numérico' })
  id_role: number;
}


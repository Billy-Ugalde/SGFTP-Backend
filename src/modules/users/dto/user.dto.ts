import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales' }
  )
  password: string;

  @IsNotEmpty({ message: 'El id_person es obligatorio' })
  @IsNumber({}, { message: 'El id_person debe ser numérico' })
  id_person: number;

  @IsOptional()
  @IsBoolean()
  status: boolean

  @IsNotEmpty({ message: 'El id_role es obligatorio' })
  @IsNumber({}, { message: 'El id_role debe ser numérico' })
  id_role: number;
}


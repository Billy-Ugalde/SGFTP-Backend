import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsPasswordMatch } from './change-password.dto'; // Reusar el decorator

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'La contraseña debe contener: mayúscula, minúscula, número y símbolo especial'
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  @IsPasswordMatch('newPassword')
  @Transform(({ value }) => value?.trim())
  confirmPassword: string;
}
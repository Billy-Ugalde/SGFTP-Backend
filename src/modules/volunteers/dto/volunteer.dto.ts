import { IsOptional, IsBoolean, IsArray, IsString, IsNumber, IsEnum, IsDateString, IsEmail, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentActivityStatus } from '../enums/enrollmentActivity.enum';

// ========== DTOs ADMIN ==========

// DTO para crear un voluntario (admin)
export class CreateVolunteerDto {
  @IsNumber()
  id_person: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// DTO para actualizar un voluntario (admin)
export class UpdateVolunteerDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ========== DTOs PÚBLICOS (Sin Auth) ==========

// DTO para crear persona (nested en registro público)
export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsOptional()
  @IsString()
  second_name?: string;

  @IsString()
  @IsNotEmpty()
  first_lastname: string;

  @IsString()
  @IsNotEmpty()
  second_lastname: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneDto)
  phones: PhoneDto[];
}

// DTO para teléfonos
export class PhoneDto {
  @IsString()
  @IsNotEmpty()
  phone_number: string;
}

// DTO para registro público de voluntario
export class PublicRegisterVolunteerDto {
  @ValidateNested()
  @Type(() => CreatePersonDto)
  person: CreatePersonDto;
}

// DTO para inscripción pública (voluntario nuevo)
export class PublicEnrollActivityDto {
  @ValidateNested()
  @Type(() => CreatePersonDto)
  person: CreatePersonDto;

  @IsNumber()
  id_activity: number;
}

// ========== DTOs VOLUNTEER (Autenticado) ==========

// DTO para actualizar perfil propio
export class UpdateOwnProfileDto {
  // Vacío por ahora - puede eliminarse o usarse para futuras actualizaciones
}

// DTO para inscribirse a actividad (voluntario autenticado)
export class SelfEnrollActivityDto {
  @IsNumber()
  id_activity: number;
}

// ========== DTOs ENROLLMENT (General) ==========

// DTO para inscribir un voluntario a una actividad (admin)
export class EnrollVolunteerDto {
  @IsNumber()
  id_volunteer: number;

  @IsNumber()
  id_activity: number;
}

// DTO para actualizar el estado de inscripción
export class UpdateEnrollmentDto {
  @IsEnum(EnrollmentActivityStatus)
  status: EnrollmentActivityStatus;

  @IsOptional()
  @IsDateString()
  attendance_date?: string;
}

// DTO para cancelar inscripción (vacío - solo para consistencia)
export class CancelEnrollmentDto {
  // Vacío - la cancelación no necesita datos adicionales
}

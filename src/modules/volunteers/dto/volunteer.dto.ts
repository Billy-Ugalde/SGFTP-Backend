import { IsOptional, IsBoolean, IsString, IsNumber, IsEnum, IsDateString, IsEmail, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentActivityStatus } from '../enums/enrollmentActivity.enum';
import { CreatePersonDto, UpdatePersonDto } from '../../person/dto/person.dto';

// ========== DTOs ADMIN ==========
// DTO para crear un voluntario (admin) - Incluye datos de persona
export class CreateVolunteerDto {
  @ValidateNested()
  @Type(() => CreatePersonDto)
  person: CreatePersonDto;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// DTO para convertir usuario existente en voluntario
export class ConvertUserToVolunteerDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

// DTO para actualizar un voluntario (admin)
export class UpdateVolunteerDto {
  @ValidateNested()
  @Type(() => UpdatePersonDto)
  person: UpdatePersonDto;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// DTO para actualizar un voluntario (admin)
export class UpdateStatusVolunteerDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ========== DTOs PÚBLICOS (Sin Auth) ==========



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

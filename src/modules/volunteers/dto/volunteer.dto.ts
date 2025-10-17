import { IsOptional, IsBoolean, IsArray, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { EnrollmentActivityStatus } from '../enums/enrollmentActivity.enum';

// DTO para crear un voluntario
export class CreateVolunteerDto {
  @IsNumber()
  id_person: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[]; // Array de habilidades

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// DTO para actualizar un voluntario
export class UpdateVolunteerDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// DTO para inscribir un voluntario a una actividad
export class EnrollVolunteerDto {
  @IsNumber()
  id_volunteer: number;

  @IsNumber()
  id_activity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO para actualizar el estado de inscripción
export class UpdateEnrollmentDto {
  @IsEnum(EnrollmentActivityStatus)
  status: EnrollmentActivityStatus;

  @IsOptional()
  @IsDateString()
  attendance_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// DTO para cancelar inscripción
export class CancelEnrollmentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

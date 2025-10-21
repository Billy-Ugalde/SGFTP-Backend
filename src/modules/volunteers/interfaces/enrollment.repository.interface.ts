import { FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';
import { Activity_enrollment } from '../entities/enrollmentActivity.entity';

/**
 * Interface para el repositorio de Activity_enrollment
 * Permite desacoplar el service de la implementación concreta de TypeORM
 */
export interface IEnrollmentRepository {
  /**
   * Buscar múltiples inscripciones
   */
  find(options?: FindManyOptions<Activity_enrollment>): Promise<Activity_enrollment[]>;

  /**
   * Buscar una inscripción
   */
  findOne(options: FindOneOptions<Activity_enrollment>): Promise<Activity_enrollment | null>;

  /**
   * Crear una instancia de inscripción (sin guardar)
   */
  create(data: DeepPartial<Activity_enrollment>): Activity_enrollment;

  /**
   * Guardar inscripción en la base de datos
   */
  save(enrollment: Activity_enrollment): Promise<Activity_enrollment>;
}

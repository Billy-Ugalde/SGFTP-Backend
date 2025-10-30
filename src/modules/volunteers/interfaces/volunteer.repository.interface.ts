import { FindManyOptions, FindOneOptions, DeepPartial, UpdateResult } from 'typeorm';
import { Volunteer } from '../entities/volunteer.entity';

/**
 * Interface para el repositorio de Volunteer
 * Permite desacoplar el service de la implementación concreta de TypeORM
 */
export interface IVolunteerRepository {
  /**
   * Buscar múltiples voluntarios
   */
  find(options?: FindManyOptions<Volunteer>): Promise<Volunteer[]>;

  /**
   * Buscar un voluntario
   */
  findOne(options: FindOneOptions<Volunteer>): Promise<Volunteer | null>;

  /**
   * Crear una instancia de voluntario (sin guardar)
   */
  create(data: DeepPartial<Volunteer>): Volunteer;

  /**
   * Guardar voluntario en la base de datos
   */
  save(volunteer: Volunteer): Promise<Volunteer>;

  /**
   * Actualizar voluntario por ID
   */
  update(id: number, data: Partial<Volunteer>): Promise<UpdateResult>;

  /**
   * Actualizar estado voluntario por ID
   */
  updateStatus(id: number, data: Partial<Volunteer>): Promise<UpdateResult>;

  /**
   * Crear query builder para consultas personalizadas
   */
  createQueryBuilder(alias?: string): any;
}

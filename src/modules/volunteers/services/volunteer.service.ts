import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Volunteer } from '../entities/volunteer.entity';
import { Activity_enrollment } from '../entities/enrollmentActivity.entity';
import {
  CreateVolunteerDto,
  UpdateVolunteerDto,
  EnrollVolunteerDto,
  UpdateEnrollmentDto,
  PublicRegisterVolunteerDto,
  PublicEnrollActivityDto,
  UpdateOwnProfileDto,
  SelfEnrollActivityDto
} from '../dto/volunteer.dto';
import { EnrollmentActivityStatus } from '../enums/enrollmentActivity.enum';
import { Person } from 'src/entities/person.entity';
import { Phone } from 'src/entities/phone.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import * as bcrypt from 'bcrypt';
import { IVolunteerRepository } from '../interfaces/volunteer.repository.interface';
import { IEnrollmentRepository } from '../interfaces/enrollment.repository.interface';
import { VOLUNTEER_REPOSITORY_TOKEN, ENROLLMENT_REPOSITORY_TOKEN } from '../constants/injection-tokens';

@Injectable()
export class VolunteerService {
  constructor(
    @Inject(VOLUNTEER_REPOSITORY_TOKEN)
    private volunteerRepository: IVolunteerRepository,
    @Inject(ENROLLMENT_REPOSITORY_TOKEN)
    private enrollmentRepository: IEnrollmentRepository,
    private dataSource: DataSource,
  ) { }

  // ========== CRUD Volunteers ==========

  async findAll(): Promise<Volunteer[]> {
    return await this.volunteerRepository.find({
      relations: ['person', 'person.phones', 'activity_enrollments', 'activity_enrollments.activity'],
      order: {
        registration_date: 'DESC'
      }
    });
  }

  async findAllActive(): Promise<Volunteer[]> {
    return await this.volunteerRepository.find({
      where: { is_active: true },
      relations: ['person', 'person.phones', 'activity_enrollments', 'activity_enrollments.activity'],
      order: {
        registration_date: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Volunteer> {
    const volunteer = await this.volunteerRepository.findOne({
      where: { id_volunteer: id },
      relations: ['person', 'person.phones', 'activity_enrollments', 'activity_enrollments.activity']
    });

    if (!volunteer) {
      throw new NotFoundException(`Voluntario con ID ${id} no encontrado`);
    }

    return volunteer;
  }

  async findByPerson(id_person: number): Promise<Volunteer | null> {
    return await this.volunteerRepository.findOne({
      where: { person: { id_person } },
      relations: ['person', 'person.phones', 'activity_enrollments', 'activity_enrollments.activity']
    });
  }

  async create(createDto: CreateVolunteerDto): Promise<Volunteer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que la persona existe
      const person = await queryRunner.manager.findOne(Person, {
        where: { id_person: createDto.id_person }
      });

      if (!person) {
        throw new NotFoundException(`Persona con ID ${createDto.id_person} no encontrada`);
      }

      // Verificar que la persona no sea ya voluntario
      const existingVolunteer = await this.volunteerRepository.findOne({
        where: { person: { id_person: createDto.id_person } }
      });

      if (existingVolunteer) {
        throw new BadRequestException('Esta persona ya está registrada como voluntario');
      }

      const volunteer = this.volunteerRepository.create({
        person: person,
        is_active: createDto.is_active ?? true,
      });

      const savedVolunteer = await queryRunner.manager.save(Volunteer, volunteer);
      await queryRunner.commitTransaction();

      return await this.findOne(savedVolunteer.id_volunteer);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateDto: UpdateVolunteerDto): Promise<Volunteer> {
    const volunteer = await this.findOne(id);

    const updateData: Partial<Volunteer> = {};

    if (updateDto.is_active !== undefined) {
      updateData.is_active = updateDto.is_active;
    }

    if (Object.keys(updateData).length > 0) {
      await this.volunteerRepository.update(id, updateData);
    }

    return await this.findOne(id);
  }

  // ========== Activity Enrollments ==========

  async enrollToActivity(enrollDto: EnrollVolunteerDto): Promise<Activity_enrollment> {
    // Verificar que el voluntario existe y está activo
    const volunteer = await this.findOne(enrollDto.id_volunteer);

    if (!volunteer.is_active) {
      throw new BadRequestException('El voluntario no está activo');
    }

    // Verificar que no esté ya inscrito en esta actividad
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        id_volunteer: enrollDto.id_volunteer,
        id_activity: enrollDto.id_activity,
        status: EnrollmentActivityStatus.ENROLLED
      }
    });

    if (existingEnrollment) {
      throw new BadRequestException('El voluntario ya está inscrito en esta actividad');
    }

    const enrollment = this.enrollmentRepository.create({
      id_volunteer: enrollDto.id_volunteer,
      id_activity: enrollDto.id_activity,
      status: EnrollmentActivityStatus.ENROLLED
    });

    return await this.enrollmentRepository.save(enrollment);
  }

  async updateEnrollmentStatus(
    id_enrollment: number,
    updateDto: UpdateEnrollmentDto
  ): Promise<Activity_enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id_enrollment_activity: id_enrollment },
      relations: ['volunteer', 'activity']
    });

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID ${id_enrollment} no encontrada`);
    }

    enrollment.status = updateDto.status;

    if (updateDto.status === EnrollmentActivityStatus.ATTENDED && updateDto.attendance_date) {
      enrollment.attendance_date = new Date(updateDto.attendance_date);
    }

    return await this.enrollmentRepository.save(enrollment);
  }

  async cancelEnrollment(id_enrollment: number): Promise<Activity_enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id_enrollment_activity: id_enrollment }
    });

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID ${id_enrollment} no encontrada`);
    }

    enrollment.status = EnrollmentActivityStatus.CANCELLED;

    return await this.enrollmentRepository.save(enrollment);
  }

  async getVolunteerEnrollments(id_volunteer: number): Promise<Activity_enrollment[]> {
    await this.findOne(id_volunteer); // Verificar que existe

    return await this.enrollmentRepository.find({
      where: { id_volunteer },
      relations: ['activity', 'activity.project', 'activity.dateActivities'],
      order: {
        enrollment_date: 'DESC'
      }
    });
  }

  async getVolunteerUpcomingEnrollments(id_volunteer: number): Promise<Activity_enrollment[]> {
    await this.findOne(id_volunteer); // Verificar que existe

    const enrollments = await this.enrollmentRepository.find({
      where: { id_volunteer },
      relations: ['activity', 'activity.project', 'activity.dateActivities'],
      order: {
        enrollment_date: 'DESC'
      }
    });

    // Filtrar solo las actividades futuras
    const now = new Date();
    return enrollments.filter(enrollment => {
      if (!enrollment.activity?.dateActivities || enrollment.activity.dateActivities.length === 0) {
        return false;
      }

      // Si tiene múltiples fechas, verificar si alguna es futura
      return enrollment.activity.dateActivities.some(dateActivity => {
        const activityDate = new Date(dateActivity.Start_date);
        return activityDate >= now;
      });
    });
  }

  async getVolunteerPastEnrollments(id_volunteer: number): Promise<Activity_enrollment[]> {
    await this.findOne(id_volunteer); // Verificar que existe

    const enrollments = await this.enrollmentRepository.find({
      where: { id_volunteer },
      relations: ['activity', 'activity.project', 'activity.dateActivities'],
      order: {
        enrollment_date: 'DESC'
      }
    });

    // Filtrar solo las actividades pasadas
    const now = new Date();
    return enrollments.filter(enrollment => {
      if (!enrollment.activity?.dateActivities || enrollment.activity.dateActivities.length === 0) {
        return false;
      }

      // Si tiene múltiples fechas, verificar si TODAS son pasadas
      return enrollment.activity.dateActivities.every(dateActivity => {
        const activityDate = new Date(dateActivity.Start_date);
        return activityDate < now;
      });
    });
  }

  async getActivityEnrollments(id_activity: number): Promise<Activity_enrollment[]> {
    return await this.enrollmentRepository.find({
      where: { id_activity },
      relations: ['volunteer', 'volunteer.person', 'volunteer.person.phones'],
      order: {
        enrollment_date: 'DESC'
      }
    });
  }

  // ========== PUBLIC METHODS (Sin autenticación) ==========

  /**
   * Registro público de voluntario
   * Crea Person + User + Volunteer en una transacción
   */
  async publicRegister(dto: PublicRegisterVolunteerDto): Promise<Volunteer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que el email no exista
      const existingPerson = await queryRunner.manager.findOne(Person, {
        where: { email: dto.person.email }
      });

      if (existingPerson) {
        throw new ConflictException('Ya existe una persona registrada con este email');
      }

      // 2. Crear Person
      const person = queryRunner.manager.create(Person, {
        first_name: dto.person.first_name,
        second_name: dto.person.second_name,
        first_lastname: dto.person.first_lastname,
        second_lastname: dto.person.second_lastname,
        email: dto.person.email,
      });

      const savedPerson = await queryRunner.manager.save(Person, person);

      // 3. Crear teléfonos
      for (const phoneData of dto.person.phones) {
        const phone = queryRunner.manager.create(Phone, {
          phone_number: phoneData.phone_number,
          person: savedPerson
        });
        await queryRunner.manager.save(Phone, phone);
      }

      // 4. Obtener el rol de voluntario
      const volunteerRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'volunteer' }
      });

      if (!volunteerRole) {
        throw new NotFoundException('El rol de voluntario no existe en el sistema');
      }

      // 5. Generar contraseña temporal
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // 6. Crear User
      const user = queryRunner.manager.create(User, {
        password: hashedPassword,
        status: true,
        isEmailVerified: false,
        failedLoginAttempts: 0,
        person: savedPerson,
        roles: [volunteerRole]
      });

      await queryRunner.manager.save(User, user);

      // 7. Crear Volunteer
      const volunteer = queryRunner.manager.create(Volunteer, {
        person: savedPerson,
        is_active: true,
      });

      const savedVolunteer = await queryRunner.manager.save(Volunteer, volunteer);

      await queryRunner.commitTransaction();

      // TODO: Enviar email con credenciales de acceso
      // await this.emailService.sendWelcomeEmail(savedPerson.email, tempPassword);

      return await this.findOne(savedVolunteer.id_volunteer);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Inscripción pública a actividad
   * Registra voluntario e inscribe a actividad en una transacción
   */
  async publicEnrollToActivity(dto: PublicEnrollActivityDto): Promise<Activity_enrollment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que la actividad existe
      const activityExists = await queryRunner.manager.findOne(
        queryRunner.manager.getRepository('Activity').target,
        { where: { id_activity: dto.id_activity } }
      );

      if (!activityExists) {
        throw new NotFoundException(`Actividad con ID ${dto.id_activity} no encontrada`);
      }

      // 2. Verificar si el email ya existe
      const existingPerson = await queryRunner.manager.findOne(Person, {
        where: { email: dto.person.email },
        relations: ['volunteer']
      });

      let volunteer: Volunteer;

      if (existingPerson) {
        // Si la persona existe, verificar si ya es voluntario
        if (existingPerson.volunteer) {
          volunteer = existingPerson.volunteer;

          // Verificar si ya está inscrito en esta actividad
          const existingEnrollment = await queryRunner.manager.findOne(Activity_enrollment, {
            where: {
              id_volunteer: volunteer.id_volunteer,
              id_activity: dto.id_activity,
              status: EnrollmentActivityStatus.ENROLLED
            }
          });

          if (existingEnrollment) {
            throw new BadRequestException('Ya estás inscrito en esta actividad. Por favor inicia sesión para ver tu inscripción.');
          }
        } else {
          // La persona existe pero no es voluntario - convertir en voluntario
          const volunteerRole = await queryRunner.manager.findOne(Role, {
            where: { name: 'volunteer' }
          });

          if (!volunteerRole) {
            throw new NotFoundException('El rol de voluntario no existe en el sistema');
          }

          // Buscar si tiene usuario
          const user = await queryRunner.manager.findOne(User, {
            where: { person: { id_person: existingPerson.id_person } },
            relations: ['roles']
          });

          if (user) {
            // Agregar rol de voluntario si no lo tiene
            if (!user.hasRole('volunteer')) {
              user.roles.push(volunteerRole);
              await queryRunner.manager.save(User, user);
            }
          } else {
            // Crear usuario nuevo
            const tempPassword = this.generateTempPassword();
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const newUser = queryRunner.manager.create(User, {
              password: hashedPassword,
              status: true,
              isEmailVerified: false,
              person: existingPerson,
              roles: [volunteerRole]
            });

            await queryRunner.manager.save(User, newUser);
          }

          // Crear perfil de voluntario
          volunteer = queryRunner.manager.create(Volunteer, {
            person: existingPerson,
            is_active: true,
          });

          volunteer = await queryRunner.manager.save(Volunteer, volunteer);
        }
      } else {
        // La persona no existe - crear todo desde cero
        const person = queryRunner.manager.create(Person, {
          first_name: dto.person.first_name,
          second_name: dto.person.second_name,
          first_lastname: dto.person.first_lastname,
          second_lastname: dto.person.second_lastname,
          email: dto.person.email,
        });

        const savedPerson = await queryRunner.manager.save(Person, person);

        // Crear teléfonos
        for (const phoneData of dto.person.phones) {
          const phone = queryRunner.manager.create(Phone, {
            phone_number: phoneData.phone_number,
            person: savedPerson
          });
          await queryRunner.manager.save(Phone, phone);
        }

        // Obtener rol de voluntario
        const volunteerRole = await queryRunner.manager.findOne(Role, {
          where: { name: 'volunteer' }
        });

        if (!volunteerRole) {
          throw new NotFoundException('El rol de voluntario no existe en el sistema');
        }

        // Crear usuario
        const tempPassword = this.generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = queryRunner.manager.create(User, {
          password: hashedPassword,
          status: true,
          isEmailVerified: false,
          person: savedPerson,
          roles: [volunteerRole]
        });

        await queryRunner.manager.save(User, user);

        // Crear voluntario
        volunteer = queryRunner.manager.create(Volunteer, {
          person: savedPerson,
          is_active: true,
        });

        volunteer = await queryRunner.manager.save(Volunteer, volunteer);
      }

      // 3. Crear la inscripción
      const enrollment = queryRunner.manager.create(Activity_enrollment, {
        id_volunteer: volunteer.id_volunteer,
        id_activity: dto.id_activity,
        status: EnrollmentActivityStatus.ENROLLED
      });

      const savedEnrollment = await queryRunner.manager.save(Activity_enrollment, enrollment);

      await queryRunner.commitTransaction();

      // TODO: Enviar email de confirmación de inscripción
      // await this.emailService.sendEnrollmentConfirmation(volunteer.person.email, activityDetails);

      return savedEnrollment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== VOLUNTEER METHODS (Autenticado como volunteer) ==========

  /**
   * Obtener perfil de voluntario por user_id
   */
  async findByUserId(userId: number): Promise<Volunteer> {
    const volunteer = await this.volunteerRepository
      .createQueryBuilder('volunteer')
      .innerJoinAndSelect('volunteer.person', 'person')
      .leftJoinAndSelect('person.phones', 'phones')
      .innerJoinAndSelect('person.user', 'user')
      .where('user.id_user = :userId', { userId })
      .getOne();

    if (!volunteer) {
      throw new NotFoundException('No se encontró un perfil de voluntario para este usuario');
    }

    return volunteer;
  }

  /**
   * Actualizar perfil propio
   * Por ahora no hay campos editables, pero mantenemos el método para futuras extensiones
   */
  async updateOwnProfile(userId: number, dto: UpdateOwnProfileDto): Promise<Volunteer> {
    const volunteer = await this.findByUserId(userId);

    // Sin campos para actualizar por ahora
    return await this.findOne(volunteer.id_volunteer);
  }

  /**
   * Inscribirse a actividad (voluntario autenticado)
   */
  async selfEnrollToActivity(userId: number, dto: SelfEnrollActivityDto): Promise<Activity_enrollment> {
    const volunteer = await this.findByUserId(userId);

    if (!volunteer.is_active) {
      throw new BadRequestException('Tu perfil de voluntario no está activo');
    }

    // Verificar que no esté ya inscrito
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        id_volunteer: volunteer.id_volunteer,
        id_activity: dto.id_activity,
        status: EnrollmentActivityStatus.ENROLLED
      }
    });

    if (existingEnrollment) {
      throw new BadRequestException('Ya estás inscrito en esta actividad');
    }

    const enrollment = this.enrollmentRepository.create({
      id_volunteer: volunteer.id_volunteer,
      id_activity: dto.id_activity,
      status: EnrollmentActivityStatus.ENROLLED
    });

    return await this.enrollmentRepository.save(enrollment);
  }

  /**
   * Obtener mis inscripciones (voluntario autenticado)
   */
  async getMyEnrollments(userId: number): Promise<Activity_enrollment[]> {
    const volunteer = await this.findByUserId(userId);

    return await this.enrollmentRepository.find({
      where: { id_volunteer: volunteer.id_volunteer },
      relations: ['activity', 'activity.project', 'activity.dateActivities'],
      order: {
        enrollment_date: 'DESC'
      }
    });
  }

  /**
   * Obtener mis inscripciones futuras (voluntario autenticado)
   */
  async getMyUpcomingEnrollments(userId: number): Promise<Activity_enrollment[]> {
    const volunteer = await this.findByUserId(userId);

    const enrollments = await this.enrollmentRepository.find({
      where: { id_volunteer: volunteer.id_volunteer },
      relations: ['activity', 'activity.project', 'activity.dateActivities'],
      order: {
        enrollment_date: 'DESC'
      }
    });

    // Filtrar solo las actividades futuras
    const now = new Date();
    return enrollments.filter(enrollment => {
      if (!enrollment.activity?.dateActivities || enrollment.activity.dateActivities.length === 0) {
        return false;
      }

      // Si tiene múltiples fechas, verificar si alguna es futura
      return enrollment.activity.dateActivities.some(dateActivity => {
        const activityDate = new Date(dateActivity.Start_date);
        return activityDate >= now;
      });
    });
  }

  /**
   * Obtener mis inscripciones pasadas (voluntario autenticado)
   */
  async getMyPastEnrollments(userId: number): Promise<Activity_enrollment[]> {
    const volunteer = await this.findByUserId(userId);

    const enrollments = await this.enrollmentRepository.find({
      where: { id_volunteer: volunteer.id_volunteer },
      relations: ['activity', 'activity.project', 'activity.dateActivities'],
      order: {
        enrollment_date: 'DESC'
      }
    });

    // Filtrar solo las actividades pasadas
    const now = new Date();
    return enrollments.filter(enrollment => {
      if (!enrollment.activity?.dateActivities || enrollment.activity.dateActivities.length === 0) {
        return false;
      }

      // Si tiene múltiples fechas, verificar si TODAS son pasadas
      return enrollment.activity.dateActivities.every(dateActivity => {
        const activityDate = new Date(dateActivity.Start_date);
        return activityDate < now;
      });
    });
  }

  /**
   * Cancelar mi inscripción (voluntario autenticado)
   */
  async cancelMyEnrollment(userId: number, id_enrollment: number): Promise<Activity_enrollment> {
    const volunteer = await this.findByUserId(userId);

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        id_enrollment_activity: id_enrollment,
        id_volunteer: volunteer.id_volunteer
      }
    });

    if (!enrollment) {
      throw new NotFoundException('Inscripción no encontrada o no te pertenece');
    }

    if (enrollment.status === EnrollmentActivityStatus.CANCELLED) {
      throw new BadRequestException('Esta inscripción ya está cancelada');
    }

    enrollment.status = EnrollmentActivityStatus.CANCELLED;

    return await this.enrollmentRepository.save(enrollment);
  }

  // ========== HELPER METHODS ==========

  /**
   * Genera contraseña temporal de 8 caracteres
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

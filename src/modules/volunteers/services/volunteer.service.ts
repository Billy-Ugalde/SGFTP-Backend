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
  SelfEnrollActivityDto,
  ConvertUserToVolunteerDto,
  UpdateStatusVolunteerDto
} from '../dto/volunteer.dto';
import { EnrollmentActivityStatus } from '../enums/enrollmentActivity.enum';
import { Person } from 'src/entities/person.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { IVolunteerRepository } from '../interfaces/volunteer.repository.interface';
import { IEnrollmentRepository } from '../interfaces/enrollment.repository.interface';
import { VOLUNTEER_REPOSITORY_TOKEN, ENROLLMENT_REPOSITORY_TOKEN } from '../constants/injection-tokens';
import { AuthEmailService } from '../../auth/services/auth-email.service';
import { Activity } from 'src/modules/projects/entities/activity.entity';
import { ActivityStatus } from 'src/modules/projects/enums/activity.enum';
import { PersonService } from '../../person/services/person.service';

@Injectable()
export class VolunteerService {
  constructor(
    @Inject(VOLUNTEER_REPOSITORY_TOKEN)
    private volunteerRepository: IVolunteerRepository,
    @Inject(ENROLLMENT_REPOSITORY_TOKEN)
    private enrollmentRepository: IEnrollmentRepository,
    private dataSource: DataSource,
    private authEmailService: AuthEmailService,
    private personService: PersonService,
  ) { }

  // ========== CRUD Volunteers ==========

  async findAll(): Promise<Volunteer[]> {
    return await this.volunteerRepository.find({
      relations: ['person', 'activity_enrollments', 'activity_enrollments.activity'],
      order: {
        registration_date: 'DESC'
      }
    });
  }

  async findAllActive(): Promise<Volunteer[]> {
    return await this.volunteerRepository.find({
      where: { is_active: true },
      relations: ['person', 'activity_enrollments', 'activity_enrollments.activity'],
      order: {
        registration_date: 'DESC'
      }
    });
  }

  async findOne(id: number): Promise<Volunteer> {
    const volunteer = await this.volunteerRepository.findOne({
      where: { id_volunteer: id },
      relations: ['person', 'activity_enrollments', 'activity_enrollments.activity']
    });

    if (!volunteer) {
      throw new NotFoundException(`Voluntario con ID ${id} no encontrado`);
    }

    return volunteer;
  }

  async findByPerson(id_person: number): Promise<Volunteer | null> {
    return await this.volunteerRepository.findOne({
      where: { person: { id_person } },
      relations: ['person', 'activity_enrollments', 'activity_enrollments.activity']
    });
  }

  async create(createDto: CreateVolunteerDto): Promise<Volunteer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que el email no exista
      const existingPerson = await queryRunner.manager.findOne(Person, {
        where: { email: createDto.person.email }
      });

      if (existingPerson) {
        throw new ConflictException('Ya existe una persona registrada con este email');
      }

      // 2. Crear Person
      const person = queryRunner.manager.create(Person, {
        first_name: createDto.person.first_name,
        second_name: createDto.person.second_name,
        first_lastname: createDto.person.first_lastname,
        second_lastname: createDto.person.second_lastname,
        email: createDto.person.email,
        phone_primary: createDto.person.phone_primary,
        phone_secondary: createDto.person.phone_secondary,
      });

      const savedPerson = await queryRunner.manager.save(Person, person);

      // 3. Obtener el rol de voluntario
      const volunteerRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'volunteer' }
      });

      if (!volunteerRole) {
        throw new NotFoundException('El rol de voluntario no existe en el sistema');
      }

      // 5. Generar token de activación
      const activationToken = require('crypto').randomBytes(32).toString('hex');
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24); // 24 horas

      // 6. Crear User con token de activación
      const user = queryRunner.manager.create(User, {
        activation_token: activationToken,
        activation_expires: tokenExpires,
        status: false, // Pendiente de activación
        isEmailVerified: false,
        failedLoginAttempts: 0,
        person: savedPerson,
        roles: [volunteerRole]
      });

      await queryRunner.manager.save(User, user);

      // 7. Crear Volunteer
      const volunteer = queryRunner.manager.create(Volunteer, {
        person: savedPerson,
        is_active: createDto.is_active ?? true,
      });

      const savedVolunteer = await queryRunner.manager.save(Volunteer, volunteer);

      await queryRunner.commitTransaction();

      // 8. Enviar email de activación
      try {
        const activationLink = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;
        await this.authEmailService.sendAccountActivationEmail(
          savedPerson.email,
          `${savedPerson.first_name} ${savedPerson.first_lastname}`,
          activationLink,
          ['volunteer']
        );
        console.log(`[VolunteerService] Email de activación enviado a: ${savedPerson.email}`);
      } catch (emailError) {
        console.error(`[VolunteerService] Error enviando email: ${emailError.message}`);
      }

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Actualizar datos de persona
      if (updateDto.person) {
        const updateData: Partial<Person> = {};

        if (updateDto.person.first_name) updateData.first_name = updateDto.person.first_name;
        if (updateDto.person.second_name !== undefined) updateData.second_name = updateDto.person.second_name;
        if (updateDto.person.first_lastname) updateData.first_lastname = updateDto.person.first_lastname;
        if (updateDto.person.second_lastname) updateData.second_lastname = updateDto.person.second_lastname;
        if (updateDto.person.phone_primary) updateData.phone_primary = updateDto.person.phone_primary;
        if (updateDto.person.phone_secondary !== undefined) updateData.phone_secondary = updateDto.person.phone_secondary;

        if (Object.keys(updateData).length > 0) {
          await queryRunner.manager.update(Person, volunteer.person.id_person, updateData);
        }
      }

      // 2. Actualizar datos de voluntario
      if (updateDto.is_active !== undefined) {
        await this.volunteerRepository.update(id, {
          is_active: updateDto.is_active
        });
      }

      await queryRunner.commitTransaction();
      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: number, updateDto: UpdateStatusVolunteerDto): Promise<Volunteer> {
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar que el voluntario existe y está activo
      const volunteer = await this.findOne(enrollDto.id_volunteer);

      if (!volunteer.is_active) {
        throw new BadRequestException('El voluntario no está activo');
      }

      // ✅ NUEVO: Verificar que la actividad existe
      const activity = await queryRunner.manager.findOne(Activity, {
        where: { Id_activity: enrollDto.id_activity }
      });

      if (!activity) {
        throw new NotFoundException(`Actividad con ID ${enrollDto.id_activity} no encontrada`);
      }

      // ✅ NUEVO: Verificar cupo disponible
      const { hasSpace, available, total } = await this.checkAvailableSpaces(
        enrollDto.id_activity, 
        queryRunner
      );

      if (!hasSpace) {
        throw new BadRequestException(
          `No hay cupo disponible. La actividad está llena (${total}/${total} espacios ocupados)`
        );
      }

      if (!activity.OpenForRegistration) {
        throw new BadRequestException('Esta actividad no está abierta para inscripciones');
      }

      // ✅ NUEVO: Verificar que la actividad está activa
      if (!activity.Active) {
          throw new BadRequestException('Esta actividad no está activa');
      }

      // ✅ NUEVO: Verificar estado de la actividad
      if (activity.Status_activity !== ActivityStatus.EXECUTION) {
          throw new BadRequestException('Esta actividad no está disponible para inscripciones');
      }

      // Verificar que no esté ya inscrito
      const existingEnrollment = await queryRunner.manager.findOne(Activity_enrollment, {
        where: {
          id_volunteer: enrollDto.id_volunteer,
          id_activity: enrollDto.id_activity,
          status: EnrollmentActivityStatus.ENROLLED
        }
      });

      if (existingEnrollment) {
        throw new BadRequestException('El voluntario ya está inscrito en esta actividad');
      }

      // Crear la inscripción
      const enrollment = queryRunner.manager.create(Activity_enrollment, {
        id_volunteer: enrollDto.id_volunteer,
        id_activity: enrollDto.id_activity,
        status: EnrollmentActivityStatus.ENROLLED
      });

      const savedEnrollment = await queryRunner.manager.save(Activity_enrollment, enrollment);

      // ✅ NUEVO: Incrementar contador de inscritos
      await this.incrementEnrolledCount(enrollDto.id_activity, queryRunner);

      await queryRunner.commitTransaction();

      return savedEnrollment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateEnrollmentStatus(
    id_enrollment: number,
    updateDto: UpdateEnrollmentDto
  ): Promise<Activity_enrollment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enrollment = await queryRunner.manager.findOne(Activity_enrollment, {
        where: { id_enrollment_activity: id_enrollment },
        relations: ['activity']
      });

      if (!enrollment) {
        throw new NotFoundException(`Inscripción con ID ${id_enrollment} no encontrada`);
      }

      const previousStatus = enrollment.status;
      enrollment.status = updateDto.status;

      // Lógica de gestión de cupos
      if (previousStatus === EnrollmentActivityStatus.ENROLLED && 
          updateDto.status === EnrollmentActivityStatus.CANCELLED) {
        await this.decrementEnrolledCount(enrollment.id_activity, queryRunner);
      } else if (previousStatus === EnrollmentActivityStatus.CANCELLED && 
                updateDto.status === EnrollmentActivityStatus.ENROLLED) {
        await this.incrementEnrolledCount(enrollment.id_activity, queryRunner);
      }

      // Lógica de fecha de asistencia - VERSIÓN SIMPLIFICADA
      if (updateDto.status === EnrollmentActivityStatus.ATTENDED) {
        enrollment.attendance_date = new Date();
      }
      // Para otros estados, no hacemos nada con attendance_date
      // o lo manejamos según la lógica de negocio

      await queryRunner.manager.save(Activity_enrollment, enrollment);
      await queryRunner.commitTransaction();

      return enrollment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelEnrollment(id_enrollment: number): Promise<Activity_enrollment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enrollment = await queryRunner.manager.findOne(Activity_enrollment, {
        where: { id_enrollment_activity: id_enrollment },
        relations: ['activity']
      });

      if (!enrollment) {
        throw new NotFoundException(`Inscripción con ID ${id_enrollment} no encontrada`);
      }

      if (enrollment.status === EnrollmentActivityStatus.CANCELLED) {
        throw new BadRequestException('Esta inscripción ya está cancelada');
      }

      const previousStatus = enrollment.status;
      enrollment.status = EnrollmentActivityStatus.CANCELLED;

      await queryRunner.manager.save(Activity_enrollment, enrollment);

      // ✅ CORRECCIÓN: Liberar cupo para cualquier estado que ocupaba espacio
      if (this.shouldReleaseSpace(previousStatus)) {
        await this.decrementEnrolledCount(enrollment.id_activity, queryRunner);
      }

      await queryRunner.commitTransaction();
      return enrollment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== HELPERS FOR ACTIVITY SPACES MANAGEMENT ==========
  private async checkAvailableSpaces(
    activityId: number, 
    queryRunner: any
  ): Promise<{ hasSpace: boolean; available: number; total: number | null }> {
    const activity = await queryRunner.manager.findOne(Activity, {
      where: { Id_activity: activityId }
    });

    if (!activity) {
      throw new NotFoundException(`Actividad con ID ${activityId} no encontrada`);
    }

    // Si Spaces es null, no hay límite
    if (activity.Spaces === null || activity.Spaces === undefined) {
      return {
        hasSpace: true,
        available: -1,
        total: null
      };
    }

    const available = activity.Spaces - activity.Enrolled_count;
    
    return {
      hasSpace: available > 0,
      available: available,
      total: activity.Spaces
    };
  }

  private async incrementEnrolledCount(activityId: number, queryRunner: any): Promise<void> {
    await queryRunner.manager.increment(
      Activity, 
      { Id_activity: activityId }, 
      'Enrolled_count', 
      1
    );
  }

  private async decrementEnrolledCount(activityId: number, queryRunner: any): Promise<void> {
    await queryRunner.manager.decrement(
      Activity, 
      { Id_activity: activityId }, 
      'Enrolled_count', 
      1
    );
  }

  private shouldReleaseSpace(previousStatus: EnrollmentActivityStatus): boolean {
    // Solo ENROLLED ocupa espacio (está inscrito activamente)
    return previousStatus === EnrollmentActivityStatus.ENROLLED;
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
      relations: ['volunteer', 'volunteer.person'],
      order: {
        enrollment_date: 'DESC'
      }
    });
  }

  // ========== PUBLIC METHODS (Sin autenticación) ==========

  /**
   * Registro público de voluntario
   * Crea Person + User + Volunteer en una transacción
   * Soporta multi-rol: si el usuario ya existe, agrega rol de voluntario
   */
  async publicRegister(dto: PublicRegisterVolunteerDto): Promise<Volunteer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar o crear Person (permite reutilizar Person existente para multi-rol)
      const { person, isNew: isNewPerson } = await this.personService.findOrCreate(dto.person, queryRunner);

      // 2. Buscar User existente por Person
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { person: { id_person: person.id_person } },
        relations: ['roles', 'person']
      });

      // 3. Verificar si ya existe Volunteer para esta persona
      const existingVolunteer = await this.volunteerRepository.findOne({
        where: { person: { id_person: person.id_person } }
      });

      if (existingVolunteer) {
        throw new ConflictException(
          existingUser?.isActive()
            ? 'Ya eres voluntario. Inicia sesión para acceder a tu cuenta.'
            : 'Ya tienes una solicitud de voluntario pendiente de activación. Revisa tu correo electrónico.'
        );
      }

      // 4. Obtener el rol de voluntario
      const volunteerRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'volunteer' }
      });

      if (!volunteerRole) {
        throw new NotFoundException('El rol de voluntario no existe en el sistema');
      }

      let user: User;
      let needsActivation = false;
      let activationToken: string | undefined;

      if (existingUser) {
        // Usuario ya existe → agregar rol si no lo tiene
        console.log('[VolunteerService] Usuario existente detectado, agregando rol de voluntario');

        if (!existingUser.hasRole('volunteer')) {
          existingUser.roles.push(volunteerRole);
          user = await queryRunner.manager.save(User, existingUser);
        } else {
          user = existingUser;
        }

        // Solo necesita activación si el usuario está inactivo
        needsActivation = !existingUser.isActive();

        if (needsActivation) {
          // Regenerar token de activación si el usuario existe pero no está activo
          activationToken = require('crypto').randomBytes(32).toString('hex');
          const tokenExpires = new Date();
          tokenExpires.setHours(tokenExpires.getHours() + 72); // 72 horas

          await queryRunner.manager.update(User, user.id_user, {
            activation_token: activationToken,
            activation_expires: tokenExpires
          });
        }

      } else {
        // Usuario nuevo → crear con token de activación
        console.log('[VolunteerService] Creando nuevo usuario con rol de voluntario');

        activationToken = require('crypto').randomBytes(32).toString('hex');
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 72); // 72 horas

        user = queryRunner.manager.create(User, {
          activation_token: activationToken,
          activation_expires: tokenExpires,
          status: false, // Pendiente de activación
          isEmailVerified: false,
          failedLoginAttempts: 0,
          person: person,
          roles: [volunteerRole]
        });

        await queryRunner.manager.save(User, user);
        needsActivation = true;
      }

      // 5. Crear registro de Volunteer
      const volunteer = queryRunner.manager.create(Volunteer, {
        person: person,
        is_active: true,
      });

      const savedVolunteer = await queryRunner.manager.save(Volunteer, volunteer);

      await queryRunner.commitTransaction();

      // 6. Enviar email SOLO si necesita activación
      if (needsActivation && activationToken) {
        try {
          const activationLink = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;
          const userName = `${person.first_name} ${person.first_lastname}`;

          await this.authEmailService.sendAccountActivationEmail(
            person.email,
            userName,
            activationLink,
            ['volunteer']
          );

          console.log(`[VolunteerService] Email de activación enviado a: ${person.email}`);
        } catch (emailError) {
          console.error(`[VolunteerService] Error enviando email: ${emailError.message}`);
        }
      } else {
        console.log(`[VolunteerService] No se envía email - usuario ya está activo (multi-rol)`);
      }

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

    let shouldSendActivationEmail = false;
    let activationToken = '';
    let personEmail = '';
    let personName = '';

    try {
      // 1. Verificar que la actividad existe
      const activityExists = await queryRunner.manager.findOne(Activity, {
        where: { Id_activity: dto.id_activity }
      });

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
            // Crear usuario nuevo con token de activación
            activationToken = require('crypto').randomBytes(32).toString('hex');
            const tokenExpires = new Date();
            tokenExpires.setHours(tokenExpires.getHours() + 24);

            const newUser = queryRunner.manager.create(User, {
              activation_token: activationToken,
              activation_expires: tokenExpires,
              status: false,
              isEmailVerified: false,
              failedLoginAttempts: 0,
              person: existingPerson,
              roles: [volunteerRole]
            });

            await queryRunner.manager.save(User, newUser);

            // Marcar que se debe enviar email
            shouldSendActivationEmail = true;
            personEmail = existingPerson.email;
            personName = `${existingPerson.first_name} ${existingPerson.first_lastname}`;
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
          phone_primary: dto.person.phone_primary,
          phone_secondary: dto.person.phone_secondary,
        });

        const savedPerson = await queryRunner.manager.save(Person, person);

        // Obtener rol de voluntario
        const volunteerRole = await queryRunner.manager.findOne(Role, {
          where: { name: 'volunteer' }
        });

        if (!volunteerRole) {
          throw new NotFoundException('El rol de voluntario no existe en el sistema');
        }

        // Crear usuario con token de activación
        activationToken = require('crypto').randomBytes(32).toString('hex');
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24);

        const user = queryRunner.manager.create(User, {
          activation_token: activationToken,
          activation_expires: tokenExpires,
          status: false,
          isEmailVerified: false,
          failedLoginAttempts: 0,
          person: savedPerson,
          roles: [volunteerRole]
        });

        await queryRunner.manager.save(User, user);

        // Marcar que se debe enviar email
        shouldSendActivationEmail = true;
        personEmail = savedPerson.email;
        personName = `${savedPerson.first_name} ${savedPerson.first_lastname}`;

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

      // Enviar email de activación DESPUÉS del commit (si es necesario)
      if (shouldSendActivationEmail) {
        try {
          const activationLink = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;
          await this.authEmailService.sendAccountActivationEmail(
            personEmail,
            personName,
            activationLink,
            ['volunteer']
          );
          console.log(`[VolunteerService - publicEnrollToActivity] Email de activación enviado a: ${personEmail}`);
        } catch (emailError) {
          console.error(`[VolunteerService - publicEnrollToActivity] Error enviando email: ${emailError.message}`);
        }
      } else {
        console.log(`[VolunteerService - publicEnrollToActivity] Usuario ya existe, no se envió email de activación`);
      }

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enrollment = await queryRunner.manager.findOne(Activity_enrollment, {
        where: {
          id_enrollment_activity: id_enrollment,
          id_volunteer: volunteer.id_volunteer
        },
        relations: ['activity']
      });

      if (!enrollment) {
        throw new NotFoundException('Inscripción no encontrada o no te pertenece');
      }

      if (enrollment.status === EnrollmentActivityStatus.CANCELLED) {
        throw new BadRequestException('Esta inscripción ya está cancelada');
      }

      const previousStatus = enrollment.status;
      enrollment.status = EnrollmentActivityStatus.CANCELLED;

      await queryRunner.manager.save(Activity_enrollment, enrollment);

      // ✅ CORRECCIÓN: Liberar cupo también en cancelación del voluntario
      if (this.shouldReleaseSpace(previousStatus)) {
        await this.decrementEnrolledCount(enrollment.id_activity, queryRunner);
      }

      await queryRunner.commitTransaction();
      return enrollment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ========== CONVERTIR USUARIO EXISTENTE A VOLUNTARIO ==========

  /**
   * Convierte un usuario existente en voluntario
   * Agrega el rol de volunteer si no lo tiene y crea el perfil de voluntario
   */
  async convertUserToVolunteer(dto: ConvertUserToVolunteerDto): Promise<Volunteer> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar persona por email
      const person = await queryRunner.manager.findOne(Person, {
        where: { email: dto.email },
        relations: ['user', 'user.roles', 'volunteer']
      });

      if (!person) {
        throw new NotFoundException('No existe una persona registrada con este email');
      }

      if (!person.user) {
        throw new BadRequestException('Esta persona no tiene un usuario asociado. Use el registro público de voluntarios');
      }

      // 2. Verificar que no sea ya voluntario
      if (person.volunteer) {
        throw new ConflictException('Este usuario ya es voluntario');
      }

      // 3. Obtener el rol de voluntario
      const volunteerRole = await queryRunner.manager.findOne(Role, {
        where: { name: 'volunteer' }
      });

      if (!volunteerRole) {
        throw new NotFoundException('El rol de voluntario no existe en el sistema');
      }

      // 4. Agregar rol de voluntario si no lo tiene
      if (!person.user.hasRole('volunteer')) {
        person.user.roles.push(volunteerRole);
        await queryRunner.manager.save(User, person.user);
      }

      // 5. Crear perfil de voluntario
      const volunteer = queryRunner.manager.create(Volunteer, {
        person: person,
        is_active: true,
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
}

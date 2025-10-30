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
import { Phone } from 'src/entities/phone.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/entities/role.entity';
import { IVolunteerRepository } from '../interfaces/volunteer.repository.interface';
import { IEnrollmentRepository } from '../interfaces/enrollment.repository.interface';
import { VOLUNTEER_REPOSITORY_TOKEN, ENROLLMENT_REPOSITORY_TOKEN } from '../constants/injection-tokens';
import { AuthEmailService } from '../../auth/services/auth-email.service';
import { Activity } from 'src/modules/projects/entities/activity.entity';

@Injectable()
export class VolunteerService {
  constructor(
    @Inject(VOLUNTEER_REPOSITORY_TOKEN)
    private volunteerRepository: IVolunteerRepository,
    @Inject(ENROLLMENT_REPOSITORY_TOKEN)
    private enrollmentRepository: IEnrollmentRepository,
    private dataSource: DataSource,
    private authEmailService: AuthEmailService,
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
      });

      const savedPerson = await queryRunner.manager.save(Person, person);

      // 3. Crear teléfonos
      for (const phoneData of createDto.person.phones) {
        const phone = queryRunner.manager.create(Phone, {
          number: phoneData.number,
          type: phoneData.type,
          is_primary: phoneData.is_primary,
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
      // 1. Actualizar datos básicos de persona
      if (updateDto.person) {
        await queryRunner.manager.update(
          Person, 
          volunteer.person.id_person, 
          {
            first_name: updateDto.person.first_name,
            second_name: updateDto.person.second_name,
            first_lastname: updateDto.person.first_lastname,
            second_lastname: updateDto.person.second_lastname,
          }
        );

        // 2. ACTUALIZAR TELÉFONO - FORMA SIMPLIFICADA
        if (updateDto.person.phones && updateDto.person.phones.length > 0) {
          const phoneData = updateDto.person.phones[0]; // Siempre el primero
          
          // Buscar el primer teléfono de esta persona
          const existingPhone = await queryRunner.manager.findOne(Phone, {
            where: {
              person: { id_person: volunteer.person.id_person }
            },
            order: { id_phone: 'ASC' } // Tomar el más viejo
          });

          if (existingPhone) {
            // ACTUALIZAR el teléfono existente
            await queryRunner.manager.update(
              Phone, 
              existingPhone.id_phone, 
              {
                number: phoneData.number,
                type: phoneData.type || existingPhone.type,
                is_primary: phoneData.is_primary !== undefined ? phoneData.is_primary : existingPhone.is_primary
              }
            );
          } else { 
            throw new NotFoundException('El voluntario no tiene teléfonos registrados para actualizar'); 
          }
        }
      }

      // 3. Actualizar datos de voluntario
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

      // ✅ NUEVO: Liberar cupo solo si estaba inscrito
      if (previousStatus === EnrollmentActivityStatus.ENROLLED) {
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
          number: phoneData.number,
          type: phoneData.type,
          is_primary: phoneData.is_primary,
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
        is_active: true,
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
            // Crear usuario nuevo con token de activación
            const activationToken = require('crypto').randomBytes(32).toString('hex');
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

            // Enviar email de activación
            try {
              const activationLink = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;
              await this.authEmailService.sendAccountActivationEmail(
                existingPerson.email,
                `${existingPerson.first_name} ${existingPerson.first_lastname}`,
                activationLink,
                ['volunteer']
              );
            } catch (emailError) {
              console.error(`[VolunteerService] Error enviando email: ${emailError.message}`);
            }
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
            number: phoneData.number,
            type: phoneData.type,
            is_primary: phoneData.is_primary,
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

        // Crear usuario con token de activación
        const activationToken = require('crypto').randomBytes(32).toString('hex');
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

        // Enviar email de activación
        try {
          const activationLink = `${process.env.FRONTEND_URL}/activate?token=${activationToken}`;
          await this.authEmailService.sendAccountActivationEmail(
            savedPerson.email,
            `${savedPerson.first_name} ${savedPerson.first_lastname}`,
            activationLink,
            ['volunteer']
          );
        } catch (emailError) {
          console.error(`[VolunteerService] Error enviando email: ${emailError.message}`);
        }

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

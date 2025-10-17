import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Volunteer } from './entities/volunteer.entitie';
import { Activity_enrollment } from './entities/enrollmentActivity.entitie';
import { CreateVolunteerDto, UpdateVolunteerDto, EnrollVolunteerDto, UpdateEnrollmentDto } from './dto/volunteer.dto';
import { EnrollmentActivityStatus } from './enums/enrollmentActivity.enum';
import { Person } from 'src/entities/person.entity';

@Injectable()
export class VolunteerService {
  constructor(
    @InjectRepository(Volunteer)
    private volunteerRepository: Repository<Volunteer>,
    @InjectRepository(Activity_enrollment)
    private enrollmentRepository: Repository<Activity_enrollment>,
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
        skills: createDto.skills ? JSON.stringify(createDto.skills) : undefined,
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

    if (updateDto.skills !== undefined) {
      updateData.skills = JSON.stringify(updateDto.skills);
    }

    if (updateDto.is_active !== undefined) {
      updateData.is_active = updateDto.is_active;
    }

    if (Object.keys(updateData).length > 0) {
      await this.volunteerRepository.update(id, updateData);
    }

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const volunteer = await this.findOne(id);
    await this.volunteerRepository.remove(volunteer);
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
      notes: enrollDto.notes,
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

    if (updateDto.notes !== undefined) {
      enrollment.notes = updateDto.notes;
    }

    return await this.enrollmentRepository.save(enrollment);
  }

  async cancelEnrollment(id_enrollment: number, notes?: string): Promise<Activity_enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id_enrollment_activity: id_enrollment }
    });

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID ${id_enrollment} no encontrada`);
    }

    enrollment.status = EnrollmentActivityStatus.CANCELLED;
    if (notes) {
      enrollment.notes = notes;
    }

    return await this.enrollmentRepository.save(enrollment);
  }

  async getVolunteerEnrollments(id_volunteer: number): Promise<Activity_enrollment[]> {
    await this.findOne(id_volunteer); // Verificar que existe

    return await this.enrollmentRepository.find({
      where: { id_volunteer },
      relations: ['activity', 'activity.project'],
      order: {
        enrollment_date: 'DESC'
      }
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
}

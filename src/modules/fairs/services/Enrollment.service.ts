import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { EnrollmentStatus, Fair_enrollment } from "../entities/Fair_enrollment.entity";
import { EnrollmentFairDto } from "../dto/enrrolmentFair.dto";
import { Entrepreneur } from "src/modules/entrepreneurs/entities/entrepreneur.entity";
import { Stand } from "../entities/stand.entity";
import { StatusEnrollmentDto } from "../dto/updatestatusEnrollment";
import { Fair } from "../entities/fair.entity";
import { NotificationService } from "src/modules/fairs-notifications/services/notification.service"; 

@Injectable()
export class EnrrolmentService {
    constructor(
        @InjectRepository(Fair_enrollment)
        private fairEnrollmentRepository: Repository<Fair_enrollment>,
        @InjectRepository(Entrepreneur)
        private entrepreneurRepository: Repository<Entrepreneur>,
        @InjectRepository(Stand)
        private standRepository: Repository<Stand>,
        private readonly dataSource: DataSource,
        @InjectRepository(Fair)
        private readonly fairRepository: Repository<Fair>,
        private readonly notificationService: NotificationService, 
    ) { }

    async create(dto: EnrollmentFairDto): Promise<Fair_enrollment> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const [fair, entrepreneur] = await Promise.all([
                queryRunner.manager.findOneBy(Fair, { id_fair: dto.id_fair }),
                queryRunner.manager.findOneBy(Entrepreneur, { id_entrepreneur: dto.id_entrepreneur }),
            ]);

            if (!fair) throw new NotFoundException('La feria no existe');
            if (!entrepreneur) throw new NotFoundException('El emprendedor no existe');

            //Valida que la feria esté activa
            if (!fair.status) {
                throw new BadRequestException('No se puede inscribir a una feria inactiva');
            }

            // Valida que la fecha de la feria no haya pasado
            const currentDate = new Date();
            if (fair.date && currentDate > fair.date) {
                throw new BadRequestException('La feria ya ha finalizado, no se permiten nuevas inscripciones');
            }

            const stand = await queryRunner.manager.findOne(Stand, {
                where: { id_stand: dto.id_stand },
                relations: ['entrepreneur', 'fair'],
                lock: { mode: 'pessimistic_write' } //bloquea por milisegundos para 2 usuarios no den click al mismo tiempo
            });

            if (!stand) throw new NotFoundException('El stand no existe');

            if (stand.fair.id_fair !== fair.id_fair) {
                throw new BadRequestException('El stand no pertenece a la feria indicada');
            }

            if (stand.entrepreneur?.id_entrepreneur === dto.id_entrepreneur) {
                throw new ConflictException('Ya tienes este stand asignado');
            }

            const active = [EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED];

            const existingEnrollment = await queryRunner.manager.findOne(Fair_enrollment, {
                where: {
                    fair: { id_fair: dto.id_fair },
                    entrepreneur: { id_entrepreneur: dto.id_entrepreneur },
                    status: In(active),
                },
                relations: ['stand']
            });

            if (existingEnrollment) {
                if (existingEnrollment.status === EnrollmentStatus.APPROVED) {
                    throw new ConflictException(
                        `Ya tienes un stand asignado en esta feria. No puedes solicitar otro stand.`
                    );
                } else {
                    throw new ConflictException(
                        `Ya tienes una solicitud pendiente en esta feria. No puedes solicitar otro stand hasta que se resuelva.`
                    );
                }
            }

            if (stand.status === true && stand.entrepreneur) {
                throw new ConflictException('El stand ya está asignado');
            }

            const standHasActiveReq = await queryRunner.manager.exists(Fair_enrollment, {
                where: {
                    stand: { id_stand: dto.id_stand },
                    status: In(active)
                },
            });

            if (standHasActiveReq) {
                throw new ConflictException('El stand tiene una solicitud activa');
            }

            const enrollment = queryRunner.manager.create(Fair_enrollment, {
                fair,
                entrepreneur,
                stand,
                status: EnrollmentStatus.PENDING,
                registration_date: new Date(),
            });

            const savedEnrollment = await queryRunner.manager.save(enrollment);

            await queryRunner.commitTransaction();
            return savedEnrollment;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findAll(): Promise<Fair_enrollment[]> {
        return this.fairEnrollmentRepository.find({
            relations: {
                fair: true,
                stand: true,
                entrepreneur: { person: true },
            },
            order: {
                registration_date: 'DESC',
            },
        });
    }

    async findAllApproved(): Promise<Fair_enrollment[]> {
        return await this.fairEnrollmentRepository.find({
            where:
                { status: EnrollmentStatus.APPROVED },
            relations: {
                fair: true,
                stand: true,
                entrepreneur: { person: true },
            },
            order: {
                registration_date: 'DESC'
            }
        });
    }

    async findAllPending(): Promise<Fair_enrollment[]> {

        return await this.fairEnrollmentRepository.find({
            where: { status: EnrollmentStatus.PENDING },
            relations: {
                fair: true,
                stand: true,
                entrepreneur: { person: true },
            },
            order: {
                registration_date: 'ASC'
            }
        });
    }

    async findAllRejected(): Promise<Fair_enrollment[]> {
        return this.fairEnrollmentRepository.find({
            where: { status: EnrollmentStatus.REJECTED },
            relations: {
                fair: true,
                stand: true,
                entrepreneur: { person: true },
            },
            order: { registration_date: 'DESC' },
        });
    }
      async findByFair(fairId: number): Promise<Fair_enrollment[]> {
        return this.fairEnrollmentRepository.find({
            where: { fair: { id_fair: fairId } },
            relations: {
                fair: true,
                stand: true,
                entrepreneur: {
                    person: true,
                    entrepreneurship: true
                },
            },
            order: {
                registration_date: 'DESC',
            },
        });
    }

    async findOne(id: number): Promise<Fair_enrollment> {
        const enrollment = await this.fairEnrollmentRepository.findOne({
            where: { id_enrrolment_fair: id },
            relations: {
                fair: true,
                stand: true,
                entrepreneur: { person: true },
            },
        });

        if (!enrollment) {
            throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
        }

        return enrollment;
    }

    async updateStatus(id: number, statusDto: StatusEnrollmentDto): Promise<Fair_enrollment> {
        const enrollment = await this.fairEnrollmentRepository.findOne({
            where: { id_enrrolment_fair: id },
            relations: ['stand', 'entrepreneur', 'fair', 'entrepreneur.person'],
        });

        if (!enrollment) {
            throw new NotFoundException('La solicitud no existe');
        }

        if (!enrollment.fair.status) {
            throw new BadRequestException('No se pueden modificar inscripciones de ferias inactivas');
        }

        if (enrollment.status !== EnrollmentStatus.PENDING) {
            throw new BadRequestException('Solo se pueden aprobar o rechazar solicitudes pendientes');
        }

        const next = statusDto.status;

        if (next === EnrollmentStatus.REJECTED) {
            enrollment.status = EnrollmentStatus.REJECTED;
            await this.fairEnrollmentRepository.save(enrollment);
            
            try {
                const recipientEmail = enrollment.entrepreneur.person.email;
                const recipientName = `${enrollment.entrepreneur.person.first_name} ${enrollment.entrepreneur.person.first_lastname || ''}`.trim();
                
                const fairDate = enrollment.fair.date
                    ? new Date(enrollment.fair.date).toLocaleString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })
                    : 'Por definir';

                const fairTypeDisplay = enrollment.fair.typeFair === 'interna' ? 'Interna' : 'Externa';
                const standCode = enrollment.stand?.stand_code || '';

                await this.notificationService.sendEnrollmentRejectedEmail(
                    recipientEmail,
                    recipientName,
                    enrollment.fair.name,
                    fairDate,
                    fairTypeDisplay,
                    standCode    
                );

                console.log(`Notificación de rechazo enviada a: ${recipientEmail} - Tipo: ${fairTypeDisplay} - Stand: ${standCode || 'N/A'}`);
            } catch (notificationError) {
                console.error('Error enviando notificación de rechazo:', notificationError);
            }

            return this.findOne(id);
        }

        if (next === EnrollmentStatus.APPROVED) {
            await this.dataSource.transaction(async (manager) => {
                const stand = await manager.findOne(Stand, {
                    where: { id_stand: enrollment.stand.id_stand },
                    lock: { mode: 'pessimistic_write' },
                    relations: ['entrepreneur'],
                });

                if (!stand) throw new NotFoundException('El stand no existe');

                if (stand.status === true && stand.entrepreneur &&
                    stand.entrepreneur.id_entrepreneur !== enrollment.entrepreneur.id_entrepreneur) {
                    throw new ConflictException('El stand ya está asignado');
                }

                stand.entrepreneur = await manager.findOneByOrFail(Entrepreneur, {
                    id_entrepreneur: enrollment.entrepreneur.id_entrepreneur,
                });
                stand.status = true;

                enrollment.status = EnrollmentStatus.APPROVED;

                await manager.save(stand);
                await manager.save(enrollment);
            });

            try {
                const recipientEmail = enrollment.entrepreneur.person.email;
                const recipientName = `${enrollment.entrepreneur.person.first_name} ${enrollment.entrepreneur.person.first_lastname || ''}`.trim();
                
                const fairDate = enrollment.fair.date
                    ? new Date(enrollment.fair.date).toLocaleString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })
                    : 'Por definir';

                const fairTypeDisplay = enrollment.fair.typeFair === 'interna' ? 'Interna' : 'Externa';

                await this.notificationService.sendEnrollmentApprovedEmail(
                    recipientEmail,
                    recipientName,
                    enrollment.fair.name,
                    fairDate,
                    enrollment.fair.location || 'Por definir',
                    enrollment.stand.stand_code,
                    fairTypeDisplay,
                    enrollment.fair.description, 
                    enrollment.fair.conditions
                );

                console.log(`Notificación de aprobación enviada a: ${recipientEmail} - Stand: ${enrollment.stand.stand_code}`);
            } catch (notificationError) {
                console.error('Error enviando notificación de aprobación:', notificationError);
            }

            return this.findOne(id);
        }
        throw new BadRequestException('Estado no permitido');
    }
}
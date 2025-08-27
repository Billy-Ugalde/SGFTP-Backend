import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { EnrollmentStatus, Fair_enrollment } from "../entities/Fair_enrollment.entity";
import { EnrollmentFairDto } from "../dto/enrrolmentFair.dto";
import { Entrepreneur } from "src/modules/entrepreneurs/entities/entrepreneur.entitie";
import { Stand } from "../entities/stand.entity";
import { StatusEnrollmentDto } from "../dto/updatestatusEnrollment";
import { Fair } from "../entities/fair.entity";
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
    ) { }

    async create(dto: EnrollmentFairDto): Promise<Fair_enrollment> {

        const [fair, stand, entrepreneur] = await Promise.all([
            this.fairRepository.findOneBy({ id_fair: dto.id_fair }),
            this.standRepository.findOne({ where: { id_stand: dto.id_stand }, relations: ['entrepreneur', 'fair'] }),
            this.entrepreneurRepository.findOneBy({ id_entrepreneur: dto.id_entrepreneur }),
        ]);
        if (!fair) throw new NotFoundException('La feria no existe');
        if (!stand) throw new NotFoundException('El stand no existe');
        if (!entrepreneur) throw new NotFoundException('El emprendedor no existe');


        if (stand.fair.id_fair !== fair.id_fair) {
            throw new BadRequestException('El stand no pertenece a la feria indicada');
        }

        const active = [EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED];

        const hasActiveForUser = await this.fairEnrollmentRepository.exist({
            where: {
                fair: { id_fair: dto.id_fair },
                entrepreneur: { id_entrepreneur: dto.id_entrepreneur },
                status: In(active),
            },
        });
        if (hasActiveForUser) {
            throw new ConflictException('Ya tienes una solicitud activa para esta feria');
        }

        if (stand.status === true && stand.entrepreneur) {
            throw new ConflictException('El stand ya está asignado');
        }

        const standHasActiveReq = await this.fairEnrollmentRepository.exist({
            where: { stand: { id_stand: dto.id_stand }, status: In(active) },
        });
        if (standHasActiveReq) {
            throw new ConflictException('El stand tiene una solicitud activa');
        }

        const enrollment = this.fairEnrollmentRepository.create({
            fair,
            entrepreneur,
            stand,
            status: EnrollmentStatus.PENDING,
            registration_date: new Date(),
        });

        return this.fairEnrollmentRepository.save(enrollment);
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
            relations: ['stand', 'entrepreneur'],
        });

        if (!enrollment) {
            throw new NotFoundException('La solicitud no existe');
        }

        if (enrollment.status !== EnrollmentStatus.PENDING) {
            throw new BadRequestException('Solo se pueden aprobar o rechazar solicitudes pendientes');
        }

        const next = statusDto.status;

        if (next === EnrollmentStatus.REJECTED) {
            enrollment.status = EnrollmentStatus.REJECTED;
            await this.fairEnrollmentRepository.save(enrollment);
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

            return this.findOne(id);
        }
        throw new BadRequestException('Estado no permitido');
    }

}
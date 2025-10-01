import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Activity } from "../entities/activity.entity";
import { DateActivity } from "../entities/date.entity";
import { DataSource, QueryFailedError, Repository } from "typeorm";
import { CreateActivityDto } from "../dto/createActivity.dto";
import { GoogleDriveService } from "src/modules/google-drive/google-drive.service";
import { ProjectService } from "./project.service";
import { IActivityService } from "../interfaces/activity.interface";
import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { UpdateActivityDto } from "../dto/updateActivity.dto";

@Injectable()
export class ActivityService implements IActivityService {
    constructor(
        @InjectRepository(Activity)
        private activityRepository: Repository<Activity>,
        @InjectRepository(DateActivity)
        private dateActivityRepository: Repository<DateActivity>,
        private dataSource: DataSource,
        private googleDriveService: GoogleDriveService,
        private projectService: ProjectService,
    ) { }

    async createActivity(
        createActivityDto: CreateActivityDto,
        image?: Express.Multer.File  // Solo 1 imagen
    ): Promise<Activity> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verificar duplicado
            const existingActivity = await queryRunner.manager.findOne(Activity, {
                where: { Name: createActivityDto.Name }
            });

            if (existingActivity) {
                throw new ConflictException(
                    'Ya existe una actividad con el mismo nombre. Por favor, verifica los datos e intenta nuevamente.',
                );
            }

            // Verificar que el proyecto existe
            const project = await this.projectService.getbyIdProject(createActivityDto.Id_project);

            // Crear actividad (sin URL aún)
            const newActivity = queryRunner.manager.create(Activity, {
                Name: createActivityDto.Name,
                Description: createActivityDto.Description,
                Conditions: createActivityDto.Conditions,
                Observations: createActivityDto.Observations,
                IsRecurring: createActivityDto.IsRecurring || false,
                IsFavorite: createActivityDto.IsFavorite,
                OpenForRegistration: createActivityDto.OpenForRegistration || false,
                Type_activity: createActivityDto.Type_activity,
                Status_activity: createActivityDto.Status_activity,
                Approach: createActivityDto.Approach,
                Spaces: createActivityDto.Spaces,
                Location: createActivityDto.Location,
                Aim: createActivityDto.Aim,
                Metric_activity: createActivityDto.Metric_activity,
                Metric_value: createActivityDto.Metric_value || 0,
                Active: createActivityDto.Active,
                project: project
            });

            const savedActivity = await queryRunner.manager.save(Activity, newActivity);

            // Crear fechas asociadas
            if (createActivityDto.dates && createActivityDto.dates.length > 0) {
                for (const dateDto of createActivityDto.dates) {
                    const dateActivity = queryRunner.manager.create(DateActivity, {
                        Start_date: dateDto.Start_date,
                        End_date: dateDto.End_date,
                        activity: savedActivity
                    });
                    await queryRunner.manager.save(DateActivity, dateActivity);
                }
            }

            // Subir imagen a Drive (solo 1)
            if (image) {
                const folderName = `activity_${savedActivity.Id_activity}`;
                const { url } = await this.googleDriveService.uploadFile(image, folderName);

                // Actualizar actividad con la URL
                await queryRunner.manager.update(Activity, savedActivity.Id_activity, {
                    url: url
                });
            }

            await queryRunner.commitTransaction();
            return await this.getbyIdActivity(savedActivity.Id_activity);

        } catch (error) {
            await queryRunner.rollbackTransaction();

            if (error instanceof QueryFailedError) {
                if (error.message.includes('Duplicate entry')) {
                    throw new ConflictException(
                        'Ya existe una actividad con el mismo nombre. Por favor, verifica los datos e intenta nuevamente.',
                    );
                }
            }
            if (error instanceof ConflictException || error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Error interno del servidor al crear la actividad',
            );
        } finally {
            await queryRunner.release();
        }
    }

    updateActivity(id_activity: number, updateActivityDto: UpdateActivityDto, images?: Express.Multer.File[]): Promise<Activity> {
        throw new Error("Method not implemented.");
    }

    async getAllActivities() {
        return await this.activityRepository.find({
            relations: ['project', 'dateActivities']
        });
    }

    async getbyIdActivity(id_activity: number): Promise<Activity> {
        const activity = await this.activityRepository.findOne({
            where: { Id_activity: id_activity },
            relations: ['project', 'dateActivities']
        });

        if (!activity) {
            throw new NotFoundException(`La actividad con ID ${id_activity} no fue encontrada`);
        }
        return activity;
    }

    async statusActivity(id_activity: number, activityStatusDto: ActivityStatusDto) {
        const activity = await this.activityRepository.findOne({
            where: { Id_activity: id_activity }
        });

        if (!activity) {
            throw new NotFoundException(`La actividad con ID ${id_activity} no fue encontrado`);
        }
        await this.activityRepository.update(id_activity, { Status_activity: activityStatusDto.Status_activity });

        const updatedActivity = await this.activityRepository.findOne({
            where: { Id_activity: id_activity }
        });

        if (!updatedActivity) {
            throw new NotFoundException(`No se pudo actualizar el estado de la actividad `);
        }
        return updatedActivity;
    }
}
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
        image?: Express.Multer.File
    ): Promise<Activity> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            const existingActivity = await queryRunner.manager.findOne(Activity, {
                where: { Name: createActivityDto.Name }
            });

            if (existingActivity) {
                throw new ConflictException(
                    'Ya existe una actividad con el mismo nombre. Por favor, verifica los datos e intenta nuevamente.',
                );
            }

            const project = await this.projectService.getbyIdProject(createActivityDto.Id_project);

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

            if (image) {
                const folderName = `activity_${savedActivity.Id_activity}`;
                const { url } = await this.googleDriveService.uploadFile(image, folderName);


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


    async updateActivity(
        id_activity: number,
        updateActivityDto: UpdateActivityDto,
        image?: Express.Multer.File
    ): Promise<Activity> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const activity = await this.getbyIdActivity(id_activity);
            let fileToDelete: string | null = null;

            const updateData: Partial<Activity> = {};

            if (updateActivityDto.Name) updateData.Name = updateActivityDto.Name;
            if (updateActivityDto.Description) updateData.Description = updateActivityDto.Description;
            if (updateActivityDto.Conditions) updateData.Conditions = updateActivityDto.Conditions;
            if (updateActivityDto.Observations) updateData.Observations = updateActivityDto.Observations;
            if (updateActivityDto.IsRecurring !== undefined) updateData.IsRecurring = updateActivityDto.IsRecurring;
            if (updateActivityDto.IsFavorite) updateData.IsFavorite = updateActivityDto.IsFavorite;
            if (updateActivityDto.OpenForRegistration !== undefined) updateData.OpenForRegistration = updateActivityDto.OpenForRegistration;
            if (updateActivityDto.Type_activity) updateData.Type_activity = updateActivityDto.Type_activity;
            if (updateActivityDto.Status_activity) updateData.Status_activity = updateActivityDto.Status_activity;
            if (updateActivityDto.Approach) updateData.Approach = updateActivityDto.Approach;
            if (updateActivityDto.Spaces !== undefined) updateData.Spaces = updateActivityDto.Spaces;
            if (updateActivityDto.Location) updateData.Location = updateActivityDto.Location;
            if (updateActivityDto.Aim) updateData.Aim = updateActivityDto.Aim;
            if (updateActivityDto.Metric_activity) updateData.Metric_activity = updateActivityDto.Metric_activity;
            if (updateActivityDto.Metric_value !== undefined) updateData.Metric_value = updateActivityDto.Metric_value;
            if (updateActivityDto.Active !== undefined) updateData.Active = updateActivityDto.Active;


            if (image) {
                console.log(`📁 Procesando imagen para actualización`);

                const folderName = `activity_${id_activity}`;
                const currentUrl = activity.url;

                if (currentUrl && currentUrl.trim() !== '') {
                    const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
                    if (fileId) {
                        fileToDelete = fileId;
                        console.log(`📝 Imagen anterior marcada para eliminación: ${fileId}`);
                    }
                }


                try {
                    console.log(`⬆️ Subiendo nueva imagen...`);
                    const { url } = await this.googleDriveService.uploadFile(image, folderName);
                    updateData.url = url;
                    console.log(`✅ Nueva URL: ${url}`);
                } catch (uploadError) {
                    throw new InternalServerErrorException(
                        `Error subiendo imagen: ${uploadError.message}`
                    );
                }
            }


            if (Object.keys(updateData).length > 0) {
                await queryRunner.manager.update(Activity, id_activity, updateData);
            }

            if (updateActivityDto.dateActivities && updateActivityDto.dateActivities.length > 0) {
                for (const dateDto of updateActivityDto.dateActivities) {
                    if (dateDto.Id_dateActivity) {
                        // Actualizar cada fecha existente por su ID
                        await queryRunner.manager.update(DateActivity, dateDto.Id_dateActivity, {
                            Start_date: dateDto.Start_date,
                            End_date: dateDto.End_date
                        });
                    }
                }
            }

            await queryRunner.commitTransaction();
            console.log('✅ Transacción confirmada');

            if (fileToDelete) {
                console.log(`🗑️ Eliminando imagen antigua`);

                this.googleDriveService.deleteFile(fileToDelete)
                    .then(() => console.log(`✅ Imagen ${fileToDelete} eliminada`))
                    .catch(error => console.error(`⚠️ No se pudo eliminar ${fileToDelete}:`, error.message));
            }

            return await this.getbyIdActivity(id_activity);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('❌ Error en actualización:', error.message);

            if (error instanceof InternalServerErrorException) {
                throw error;
            }

            throw new InternalServerErrorException(
                `Error actualizando actividad: ${error.message}`
            );
        } finally {
            await queryRunner.release();
        }
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
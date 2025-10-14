import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Activity } from "../entities/activity.entity";
import { DateActivity } from "../entities/date.entity";
import { DataSource, QueryFailedError, Repository } from "typeorm";
import { CreateActivityDto } from "../dto/createActivity.dto";
import { GoogleDriveService } from "src/modules/google-drive/google-drive.service";
import { ProjectService } from "./project.service";
import { IActivityService, ActivityFiles } from "../interfaces/activity.interface";
import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { UpdateActivityDto } from "../dto/updateActivity.dto";
import { ACTIVITY_TYPE_TO_PROJECT_METRIC } from "../Constants/activity-metrics.constant";
import { Project } from "../entities/project.entity";

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
        images?: Express.Multer.File[]
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
                Metric_value: 0,
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

            if (images && images.length > 0) {
                const folderName = `activity_${savedActivity.Id_activity}`;
                const urls: string[] = [];

                // Subir cada imagen al Drive
                for (const image of images) {
                    const { url } = await this.googleDriveService.uploadFile(image, folderName);
                    urls.push(url);
                }

                // Asignar las URLs (hasta 3)
                await queryRunner.manager.update(Activity, savedActivity.Id_activity, {
                    url1: urls[0] || undefined,
                    url2: urls[1] || undefined,
                    url3: urls[2] || undefined
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
        files?: ActivityFiles
    ): Promise<Activity> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const activity = await this.getbyIdActivity(id_activity);
            const filesToDelete: string[] = [];

            const updateData: Partial<Activity> = {};

            const oldMetricActivity = activity.Metric_activity;
            const metricActivityChanged = updateActivityDto.Metric_activity &&
                updateActivityDto.Metric_activity !== oldMetricActivity;

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

            // 2. Procesar imágenes con acciones específicas
            const imageFields = ['url1', 'url2', 'url3'] as const;
            const folderName = `activity_${id_activity}`;

            // Función para obtener archivo específico por campo
            const getFileForField = (fieldName: string): Express.Multer.File | undefined => {
                if (!files) return undefined;

                // Buscar en field names específicos (url_1_file, url_2_file, etc.)
                const specificField = `${fieldName}_file` as keyof typeof files;
                const fileArray = files[specificField];

                if (fileArray && fileArray.length > 0) {
                    return fileArray[0];
                }

                // Fallback: buscar en el array 'images' por orden
                if (files.images && files.images.length > 0) {
                    const index = imageFields.indexOf(fieldName as any);
                    if (index >= 0 && index < files.images.length) {
                        return files.images[index];
                    }
                }

                return undefined;
            };
            // Procesar cada campo de imagen
            for (const field of imageFields) {
                const actionField = `${field}_action` as keyof UpdateActivityDto;
                const action = updateActivityDto[actionField] as string;
                const currentUrl = activity[field];

                switch (action) {
                    case 'keep':
                        // Mantener la URL existente
                        if (currentUrl) {
                            updateData[field] = currentUrl;
                        } else {
                            updateData[field] = '';
                        }
                        break;

                    case 'replace':
                        // Obtener archivo específico para este campo
                        const replaceFile = getFileForField(field);

                        if (replaceFile) {
                            // Marcar imagen anterior para eliminación
                            if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
                                const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
                                if (fileId) {
                                    filesToDelete.push(fileId);
                                }
                            }

                            // Subir nueva imagen
                            try {
                                const { url } = await this.googleDriveService.uploadFile(replaceFile, folderName);
                                updateData[field] = url;
                            } catch (uploadError) {
                                throw new InternalServerErrorException(
                                    `Error subiendo imagen ${field}: ${uploadError.message}`
                                );
                            }
                        } else {
                            // Si no hay archivo nuevo pero la acción es replace, mantener el actual
                            if (currentUrl) {
                                updateData[field] = currentUrl;
                            } else {
                                updateData[field] = '';
                            }
                        }
                        break;

                    case 'delete':
                        // Eliminar imagen
                        if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim() !== '') {
                            const fileId = this.googleDriveService.extractFileIdFromUrl(currentUrl);
                            if (fileId) {
                                filesToDelete.push(fileId);
                            }
                        }
                        // Establecer campo vacío (no NULL)
                        updateData[field] = '';
                        break;

                    case 'add':
                        // Obtener archivo específico para este campo
                        const addFile = getFileForField(field);

                        if (addFile) {
                            try {
                                const { url } = await this.googleDriveService.uploadFile(addFile, folderName);
                                updateData[field] = url;
                            } catch (uploadError) {
                                throw new InternalServerErrorException(
                                    `Error subiendo imagen ${field}: ${uploadError.message}`
                                );
                            }
                        } else {
                            // Si no hay archivo, mantener vacío
                            updateData[field] = '';
                        }
                        break;

                    default:
                        // Sin acción definida: mantener el valor actual
                        if (currentUrl) {
                            updateData[field] = currentUrl;
                        } else {
                            updateData[field] = '';
                        }
                        break;
                }


            }
            //3 Aplicar actualización
            if (Object.keys(updateData).length > 0) {
                await queryRunner.manager.update(Activity, id_activity, updateData);
            }

            if (updateActivityDto.dateActivities && updateActivityDto.dateActivities.length > 0) {
                for (const dateDto of updateActivityDto.dateActivities) {
                    if (dateDto.Id_dateActivity) {
                        await queryRunner.manager.update(DateActivity, dateDto.Id_dateActivity, {
                            Start_date: dateDto.Start_date,
                            End_date: dateDto.End_date
                        });
                    }
                }
            }

            if (metricActivityChanged) {
                await this.recalculateProjectMetricForType(
                    activity.project.Id_project,
                    oldMetricActivity,
                    id_activity,
                    queryRunner
                );

                await this.recalculateProjectMetricForType(
                    activity.project.Id_project,
                    updateActivityDto.Metric_activity,
                    null,
                    queryRunner
                );
            } else if (updateActivityDto.Metric_value !== undefined) {

                await this.updateProjectMetrics(id_activity, queryRunner, updateActivityDto.Metric_value);
            }

            await queryRunner.commitTransaction();

            // Eliminar archivos antiguos (después del commit)
            if (filesToDelete.length > 0) {
                await Promise.all(
                    filesToDelete.map(async (fileId) => {
                        try {
                            await this.googleDriveService.deleteFile(fileId);
                        } catch (deleteError) {
                            console.error(`⚠️ No se pudo eliminar ${fileId}:`, deleteError.message);
                        }
                    })
                );
            }

            return await this.getbyIdActivity(id_activity);

        } catch (error) {
            await queryRunner.rollbackTransaction();

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

    private async updateProjectMetrics(activityId: number, queryRunner: any, newMetricValue: number): Promise<void> {
        const activity = await queryRunner.manager.findOne(Activity, {
            where: { Id_activity: activityId },
            relations: ['project']
        });

        if (!activity || !activity.project) {
            return;
        }

        const projectMetricField = ACTIVITY_TYPE_TO_PROJECT_METRIC[activity.Metric_activity];

        if (!projectMetricField) {
            return;
        }
        const otherActivities = await queryRunner.manager
            .createQueryBuilder(Activity, 'activity')
            .where('activity.Id_project = :projectId', { projectId: activity.project.Id_project })
            .andWhere('activity.Metric_activity = :metricActivity', { metricActivity: activity.Metric_activity })
            .andWhere('activity.Id_activity != :activityId', { activityId: activityId })
            .getMany();
        const otherActivitiesTotal = otherActivities.reduce((sum, act) => sum + (act.Metric_value || 0), 0);
        const totalMetric = otherActivitiesTotal + newMetricValue;

        await queryRunner.manager.update(Project, activity.project.Id_project, {
            [projectMetricField]: totalMetric
        });
    }

    private async recalculateProjectMetricForType(
        projectId: number,
        metricActivity: string,
        excludeActivityId: number | null,
        queryRunner: any
    ): Promise<void> {
        const projectMetricField = ACTIVITY_TYPE_TO_PROJECT_METRIC[metricActivity];

        if (!projectMetricField) {
            return;
        }

        const query = queryRunner.manager
            .createQueryBuilder(Activity, 'activity')
            .where('activity.Id_project = :projectId', { projectId })
            .andWhere('activity.Metric_activity = :metricActivity', { metricActivity });

        if (excludeActivityId) {
            query.andWhere('activity.Id_activity != :excludeActivityId', { excludeActivityId });
        }

        const activities = await query.getMany();

        const totalMetric = activities.reduce((sum, act) => sum + (act.Metric_value || 0), 0);

        await queryRunner.manager.update(Project, projectId, {
            [projectMetricField]: totalMetric
        });
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

    async updateActive(id_activity: number, active: boolean): Promise<Activity> {
        const activity = await this.activityRepository.findOne({
            where: { Id_activity: id_activity }
        });

        if (!activity) {
            throw new NotFoundException(`Actividad con ID ${id_activity} no encontrada`);
        }

        activity.Active = active;
        return await this.activityRepository.save(activity);
    }
}
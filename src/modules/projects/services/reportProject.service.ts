import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buffer } from 'buffer';
import { Project } from '../entities/project.entity';
import { IReportProjectService, ReportData } from '../interfaces/reportProject.interface';
import { Activity } from '../entities/activity.entity';
import { ActivityStatus } from '../enums/activity.enum';
import * as PDFDocument from 'pdfkit';

type PDFDoc = PDFDocument;

@Injectable()
export class ReportProjectService implements IReportProjectService {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
    ) { }

    async createReportProjectPDF(id_project: number): Promise<Buffer> {
        const data = await this.getByProjectReport(id_project);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 }
                });

                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                this.generatePDFContent(doc, data);
                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    createReportProjectXLSX(id_project: number): Promise<Buffer> {
        throw new Error('Method not implemented.');
    }

    async getByProjectReport(id_project: number): Promise<ReportData> {
        const project = await this.projectRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.activity', 'activity')
            .leftJoinAndSelect('activity.dateActivities', 'dateActivity')
            .select([
                'project.Id_project',
                'project.Name',
                'project.Description',
                'project.Aim',
                'project.Start_date',
                'project.End_date',
                'project.Status',
                'project.Target_population',
                'project.Location',
                'project.METRIC_TOTAL_BENEFICIATED',
                'project.METRIC_TOTAL_WASTE_COLLECTED',
                'project.METRIC_TOTAL_TREES_PLANTED',

                // Campos de las Actividades
                'activity.Id_activity',
                'activity.Name',
                'activity.Description',
                'activity.OpenForRegistration',
                'activity.Type_activity',
                'activity.Status_activity',
                'activity.Approach',
                'activity.Location',
                'activity.Aim',
                'activity.Metric_activity',
                'activity.Metric_value',
                'activity.Registration_date',

                // Fechas de DateActivity
                'dateActivity.Id_dateActivity',
                'dateActivity.Start_date',
                'dateActivity.End_date',
            ])
            .where('project.Id_project = :id_project', { id_project })
            .orderBy('dateActivity.Start_date', 'ASC')
            .getOne();

        if (!project) {
            throw new NotFoundException(`Proyecto con ID ${id_project} no encontrado`);
        }

        const reportData: ReportData = {
            project: {
                Id_project: project.Id_project,
                Name: project.Name,
                Description: project.Description,
                Aim: project.Aim,

                Start_date: new Date(project.Start_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }),

                End_date: project.End_date
                    ? new Date(project.End_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })
                    : 'Ongoing',

                Status: project.Status,
                Target_population: project.Target_population,
                Location: project.Location,
                METRIC_TOTAL_BENEFICIATED: project.METRIC_TOTAL_BENEFICIATED,
                METRIC_TOTAL_WASTE_COLLECTED: project.METRIC_TOTAL_WASTE_COLLECTED,
                METRIC_TOTAL_TREES_PLANTED: project.METRIC_TOTAL_TREES_PLANTED,
            },
            activities: project.activity.map(activity => ({
                Id_activity: activity.Id_activity,
                Name: activity.Name,
                Description: activity.Description,
                OpenForRegistration: activity.OpenForRegistration,
                Type_activity: activity.Type_activity,
                Status_activity: activity.Status_activity,
                Approach: activity.Approach,
                Location: activity.Location,
                Aim: activity.Aim,
                Metric_activity: activity.Metric_activity,
                Metric_value: activity.Metric_value,

                Start_date: activity.dateActivities?.[0]?.Start_date
                    ? new Date(activity.dateActivities[0].Start_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : undefined,
                End_date: activity.dateActivities?.[0]?.End_date
                    ? new Date(activity.dateActivities[0].End_date).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : undefined,
            })),
            statistics: {
                total_activities: project.activity.length,
                pending_activities: project.activity.filter(a => a.Status_activity === ActivityStatus.PENDING).length,
                planning_activities: project.activity.filter(a => a.Status_activity === ActivityStatus.PLANNING).length,
                execution_activities: project.activity.filter(a => a.Status_activity === ActivityStatus.EXECUTION).length,
                suspended_activities: project.activity.filter(a => a.Status_activity === ActivityStatus.SUSPENDED).length,
                finished_activities: project.activity.filter(a => a.Status_activity === ActivityStatus.FINISHED).length,
            }
        };

        return reportData;
    }

    private generatePDFContent(doc: PDFDoc, data: ReportData): void {
        const { project, activities, statistics } = data;

        // HEADER - Título del reporte
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .text('REPORTE DE PROYECTO', { align: 'center' })
            .moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' })
            .moveDown(2);

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN DEL PROYECTO')
            .moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000');

        this.addField(doc, 'Nombre:', project.Name);
        this.addField(doc, 'Descripción:', project.Description);
        this.addField(doc, 'Objetivo:', project.Aim);
        this.addField(doc, 'Ubicación:', project.Location);
        this.addField(doc, 'Estado:', this.translateProjectStatus(project.Status));
        this.addField(doc, 'Población Objetivo:', project.Target_population);
        this.addField(doc, 'Fecha Inicio:', project.Start_date);
        this.addField(doc, 'Fecha Fin:', project.End_date);

        doc.moveDown(1.5);

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('MÉTRICAS DE IMPACTO')
            .moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000');

        this.addField(doc, 'Total Beneficiados:', project.METRIC_TOTAL_BENEFICIATED.toString());
        this.addField(doc, 'Total Residuos Recolectados (kg):', project.METRIC_TOTAL_WASTE_COLLECTED.toString());
        this.addField(doc, 'Total Árboles Plantados:', project.METRIC_TOTAL_TREES_PLANTED.toString());

        doc.moveDown(1.5);


        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('ESTADÍSTICAS DE ACTIVIDADES')
            .moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000');

        this.addField(doc, 'Total de Actividades:', statistics.total_activities.toString());
        this.addField(doc, 'Pendientes:', statistics.pending_activities.toString());
        this.addField(doc, 'En Planificación:', statistics.planning_activities.toString());
        this.addField(doc, 'En Ejecución:', statistics.execution_activities.toString());
        this.addField(doc, 'Suspendidas:', statistics.suspended_activities.toString());
        this.addField(doc, 'Finalizadas:', statistics.finished_activities.toString());

        
        doc.addPage();

       
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('DETALLE DE ACTIVIDADES')
            .moveDown(1);

        activities.forEach((activity, index) => {
          
            if (doc.y > 600) {
                doc.addPage();
            }

            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#34495e')
                .text(`${index + 1}. ${activity.Name}`)
                .moveDown(0.3);

            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#000000');

            this.addField(doc, 'Descripción:', activity.Description, 9);
            this.addField(doc, 'Objetivo:', activity.Aim, 9);
            this.addField(doc, 'Ubicación:', activity.Location, 9);

            // Fechas
            if (activity.Start_date) {
                this.addField(doc, 'Fecha Inicio:', activity.Start_date, 9);
            }
            if (activity.End_date) {
                this.addField(doc, 'Fecha Fin:', activity.End_date, 9);
            }

            this.addField(doc, 'Tipo:', this.translateActivityType(activity.Type_activity), 9);
            this.addField(doc, 'Estado:', this.translateActivityStatus(activity.Status_activity), 9);
            this.addField(doc, 'Enfoque:', this.translateApproach(activity.Approach), 9);
            this.addField(doc, 'Abierto a Inscripción:', activity.OpenForRegistration ? 'Sí' : 'No', 9);
            this.addField(doc, 'Métrica:', `${this.translateMetric(activity.Metric_activity)}: ${activity.Metric_value}`, 9);

            doc.moveDown(0.8);

            doc.moveTo(50, doc.y)
                .lineTo(550, doc.y)
                .strokeColor('#bdc3c7')
                .lineWidth(0.5)
                .stroke()
                .moveDown(0.8);
        });
    }

    private addField(doc: PDFDoc, label: string, value: string, fontSize: number = 10): void {
        doc.fontSize(fontSize)
            .font('Helvetica-Bold')
            .text(label, { continued: true })
            .font('Helvetica')
            .text(` ${value}`)
            .moveDown(0.3);
    }

    private translateActivityType(type: string): string {
        const translations = {
            'conference': 'Conferencia',
            'workshop': 'Taller',
            'reforestation': 'Reforestación',
            'garbage_collection': 'Recolección de Basura',
            'special_event': 'Evento Especial',
            'cleanup': 'Limpieza',
            'cultutal_event': 'Evento Cultural'
        };
        return translations[type] || type;
    }

    private translateActivityStatus(status: string): string {
        const translations = {
            'pending': 'Pendiente',
            'planning': 'En Planificación',
            'execution': 'En Ejecución',
            'suspended': 'Suspendida',
            'finished': 'Finalizada'
        };
        return translations[status] || status;
    }

    private translateApproach(approach: string): string {
        const translations = {
            'social': 'Social',
            'cultural': 'Cultural',
            'environmental': 'Ambiental'
        };
        return translations[approach] || approach;
    }

    private translateMetric(metric: string): string {
        const translations = {
            'attendance': 'Asistencia',
            'trees_planted': 'Árboles Plantados',
            'waste_collected': 'Residuos Recolectados (kg)'
        };
        return translations[metric] || metric;
    }

    private translateProjectStatus(status: string): string {
        const translations = {
            'pending': 'Pendiente',
            'planning': 'En Planificación',
            'execution': 'En Ejecución',
            'suspended': 'Suspendida',
            'finished': 'Finalizada'
        };
        return translations[status] || status;
    }
}
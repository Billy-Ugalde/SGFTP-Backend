import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import {
    IReportActivityService,
    ActivityReportData,
    ActivityBasicInfo,
    EnrollmentReportData,
    ActivityStatisticsData,
    VolunteerEnrollmentInfo
} from '../interfaces/reportActivity.interface';

import * as PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { Activity_enrollment } from 'src/modules/volunteers/entities/enrollmentActivity.entity';

type PDFDoc = PDFDocument;
@Injectable()
export class ReportActivityService implements IReportActivityService {
    private readonly logger = new Logger(ReportActivityService.name);

    constructor(
        @InjectRepository(Activity)
        private readonly activityRepository: Repository<Activity>,
        @InjectRepository(Activity_enrollment)
        private readonly enrollmentRepository: Repository<Activity_enrollment>,
    ) { }

    async createReportActivityPDF(id_activity: number): Promise<Buffer> {
        this.logger.log(`Generando reporte PDF para actividad ID: ${id_activity}`);

        const data = await this.getByActivityReport(id_activity);

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
                this.logger.error(`Error generando PDF para actividad ${id_activity}: ${error.message}`, error.stack);
                reject(error);
            }
        });
    }

    async createReportActivityXLSX(id_activity: number): Promise<Buffer> {
        this.logger.log(`Generando reporte Excel para actividad ID: ${id_activity}`);

        try {
            const reportData: ActivityReportData = await this.getByActivityReport(id_activity);

            const workbook = XLSX.utils.book_new();

            // HOJA 1: RESUMEN DE LA ACTIVIDAD
            this.createSummarySheet(workbook, reportData);

            // HOJA 2: LISTA DE VOLUNTARIOS INSCRITOS
            this.createVolunteersSheet(workbook, reportData);

            // HOJA 3: ESTADÍSTICAS Y MÉTRICAS
            this.createStatisticsSheet(workbook, reportData);

            // HOJA 4: ASISTENCIA (Voluntarios que asistieron)
            this.createAttendanceSheet(workbook, reportData);

            const excelBuffer = XLSX.write(workbook, {
                bookType: 'xlsx',
                type: 'buffer'
            });

            return Buffer.from(excelBuffer);

        } catch (error) {
            this.logger.error(`Error generando Excel para actividad ${id_activity}: ${error.message}`, error.stack);
            throw new Error(`Error al generar el reporte Excel: ${error.message}`);
        }
    }

    async getByActivityReport(id_activity: number): Promise<ActivityReportData> {
        this.logger.log(`Obteniendo datos de reporte para actividad ID: ${id_activity}`);

        const activity = await this.activityRepository.findOne({
            where: { Id_activity: id_activity },
            relations: ['project', 'dateActivities']
        });

        if (!activity) {
            throw new NotFoundException(`Actividad con ID ${id_activity} no encontrada`);
        }

        // TODO: Obtener inscripciones de voluntarios con sus relaciones
        const enrollments = await this.enrollmentRepository.find({
            where: { id_activity: id_activity },
            relations: ['volunteer', 'volunteer.person', 'volunteer.person.phones'],
            order: { enrollment_date: 'DESC' }
        });

        // TODO: Procesar datos de inscripciones
        const volunteers: VolunteerEnrollmentInfo[] = enrollments.map(enrollment => ({
            id_enrollment: enrollment.id_enrollment_activity,
            volunteer_name: `${enrollment.volunteer?.person?.first_name || ''} ${enrollment.volunteer?.person?.first_lastname || ''}`.trim(),
            volunteer_email: enrollment.volunteer?.person?.email || 'N/A',
            volunteer_phone: enrollment.volunteer?.person?.phones?.[0]?.number || 'N/A',
            enrollment_date: enrollment.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString('es-ES') : 'N/A',
            status: enrollment.status || 'N/A',
            attendance_date: enrollment.attendance_date ? new Date(enrollment.attendance_date).toLocaleDateString('es-ES') : undefined
        }));

        // TODO: Calcular estadísticas
        const total_enrolled = enrollments.filter(e => e.status === 'enrolled').length;
        const total_attended = enrollments.filter(e => e.status === 'attended').length;
        const total_not_attended = enrollments.filter(e => e.status === 'not_attended').length;
        const total_cancelled = enrollments.filter(e => e.status === 'cancelled').length;

        const attendance_rate = total_enrolled > 0 ? (total_attended / total_enrolled) * 100 : 0;
        const cancellation_rate = enrollments.length > 0 ? (total_cancelled / enrollments.length) * 100 : 0;

        return {
            activity: {
                Id_activity: activity.Id_activity,
                Name: activity.Name || 'N/A',
                Description: activity.Description || 'N/A',
                Aim: activity.Aim || 'N/A',
                Location: activity.Location || 'N/A',
                Type_activity: activity.Type_activity || 'N/A',
                Status_activity: activity.Status_activity || 'N/A',
                Approach: activity.Approach || 'N/A',
                OpenForRegistration: activity.OpenForRegistration || false,
                Metric_activity: activity.Metric_activity || 'N/A',
                Metric_value: activity.Total_metric_value || 0,
                Start_date: activity.dateActivities?.[0]?.Start_date
                    ? new Date(activity.dateActivities[0].Start_date).toLocaleDateString('es-ES', {
                        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                    })
                    : undefined,
                End_date: activity.dateActivities?.[0]?.End_date
                    ? new Date(activity.dateActivities[0].End_date).toLocaleDateString('es-ES', {
                        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                    })
                    : undefined,
                Registration_date: activity.Registration_date
                    ? new Date(activity.Registration_date).toLocaleDateString('es-ES')
                    : 'N/A',
                Project_name: activity.project?.Name || 'N/A'
            },
            enrollments: {
                total_enrolled,
                total_attended,
                total_not_attended,
                total_cancelled,
                volunteers
            },
            statistics: {
                total_volunteers: enrollments.length,
                attendance_rate: parseFloat(attendance_rate.toFixed(2)),
                cancellation_rate: parseFloat(cancellation_rate.toFixed(2)),
                pending_confirmations: total_enrolled - total_attended - total_not_attended
            }
        };
    }

    // ==================== MÉTODOS PRIVADOS PARA PDF ====================

    private generatePDFContent(doc: PDFDoc, data: ActivityReportData): void {
        const { activity, enrollments, statistics } = data;

        // Header
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .text('REPORTE DE ACTIVIDAD', { align: 'center' })
            .moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' })
            .moveDown(2);

        // ========== SECCIÓN 1: INFORMACIÓN GENERAL DE LA ACTIVIDAD ==========
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('INFORMACIÓN GENERAL')
            .moveDown(0.5);

        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        this.addField(doc, 'Nombre:', activity.Name);
        this.addField(doc, 'Proyecto:', activity.Project_name || 'N/A');
        this.addField(doc, 'Descripción:', activity.Description);
        this.addField(doc, 'Objetivo:', activity.Aim);
        this.addField(doc, 'Ubicación:', activity.Location);
        this.addField(doc, 'Tipo:', this.translateActivityType(activity.Type_activity));
        this.addField(doc, 'Estado:', this.translateActivityStatus(activity.Status_activity));
        this.addField(doc, 'Enfoque:', this.translateApproach(activity.Approach));
        this.addField(doc, 'Abierta a Inscripción:', activity.OpenForRegistration ? 'Sí' : 'No');
        this.addField(doc, 'Fecha Inicio:', activity.Start_date || 'N/A');
        this.addField(doc, 'Fecha Fin:', activity.End_date || 'N/A');
        this.addField(doc, 'Fecha de Registro:', activity.Registration_date);
        this.addField(doc, 'Métrica:', activity.Metric_activity);
        this.addField(doc, 'Valor de Métrica:', activity.Metric_value.toString());

        doc.moveDown(1.5);

        // ========== SECCIÓN 2: ESTADÍSTICAS GENERALES ==========
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('ESTADÍSTICAS GENERALES')
            .moveDown(0.5);

        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        this.addField(doc, 'Total Voluntarios:', statistics.total_volunteers.toString());
        this.addField(doc, 'Asistencia:', statistics.attendance_rate.toString());
        this.addField(doc, 'Cancelación:', statistics.cancellation_rate.toString());
        this.addField(doc, 'Confirmaciones Pendientes:', statistics.pending_confirmations.toString());

        doc.moveDown(1);

        // ========== SECCIÓN 3: DISTRIBUCIÓN POR ESTADO ==========
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('Distribución por Estado')
            .moveDown(0.5);

        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        this.addField(doc, '• Inscritos:', enrollments.total_enrolled.toString());
        this.addField(doc, '• Asistieron:', enrollments.total_attended.toString());
        this.addField(doc, '• No Asistieron:', enrollments.total_not_attended.toString());
        this.addField(doc, '• Cancelaron:', enrollments.total_cancelled.toString());

        doc.addPage();

        // ========== SECCIÓN 4: LISTA DE VOLUNTARIOS INSCRITOS ==========
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('LISTA DE VOLUNTARIOS INSCRITOS')
            .moveDown(0.3);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#666666')
            .text(`Total: ${enrollments.volunteers.length} voluntarios`)
            .moveDown(1);

        if (enrollments.volunteers.length > 0) {
            this.generateVolunteersTable(doc, enrollments.volunteers);
        } else {
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#999999')
                .text('No hay voluntarios inscritos en esta actividad.', { align: 'center' });
        }

        // ========== SECCIÓN 5: REGISTRO DE ASISTENCIA ==========
        const attendees = enrollments.volunteers.filter(v => v.status === 'attended');

        if (attendees.length > 0) {
            doc.addPage();

            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#2c3e50')
                .text('REGISTRO DE ASISTENCIA')
                .moveDown(0.3);

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#666666')
                .text(`Total: ${attendees.length} voluntarios asistieron`)
                .moveDown(1);

            this.generateAttendanceTable(doc, attendees);
        }
    }

    private addField(doc: PDFDoc, label: string, value: string, fontSize: number = 10): void {
        doc.fontSize(fontSize)
            .font('Helvetica-Bold')
            .text(label, { continued: true })
            .font('Helvetica')
            .text(` ${value}`)
            .moveDown(0.3);
    }

    private generateVolunteersTable(doc: PDFDoc, volunteers: VolunteerEnrollmentInfo[]): void {
        const tableTop = doc.y;
        const itemsPerPage = 15; // Número de voluntarios por página
        let currentY = tableTop;
        const leftMargin = 50;
        const columnWidths = {
            no: 30,
            name: 120,
            email: 140,
            phone: 80,
            date: 70,
            status: 70
        };

        // Función para dibujar el header de la tabla
        const drawTableHeader = (y: number) => {
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#FFFFFF');

            // Fondo del header
            doc.rect(leftMargin, y, 510, 20)
                .fill('#2c3e50');

            doc.fillColor('#FFFFFF');
            doc.text('N°', leftMargin + 5, y + 5, { width: columnWidths.no, align: 'center' });
            doc.text('Nombre', leftMargin + columnWidths.no + 5, y + 5, { width: columnWidths.name });
            doc.text('Email', leftMargin + columnWidths.no + columnWidths.name + 5, y + 5, { width: columnWidths.email });
            doc.text('Teléfono', leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + 5, y + 5, { width: columnWidths.phone });
            doc.text('Fecha Inscr.', leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + columnWidths.phone + 5, y + 5, { width: columnWidths.date });
            doc.text('Estado', leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + columnWidths.phone + columnWidths.date + 5, y + 5, { width: columnWidths.status });

            return y + 25;
        };

        // Dibujar header inicial
        currentY = drawTableHeader(currentY);

        // Dibujar filas
        volunteers.forEach((volunteer, index) => {
            // Si nos acercamos al final de la página, crear nueva página
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
                currentY = drawTableHeader(currentY);
            }

            const rowHeight = 20;
            const fillColor = index % 2 === 0 ? '#f8f9fa' : '#FFFFFF';

            // Fondo de la fila
            doc.rect(leftMargin, currentY, 510, rowHeight)
                .fill(fillColor);

            // Contenido de la fila
            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#000000');

            doc.text((index + 1).toString(), leftMargin + 5, currentY + 5, { width: columnWidths.no, align: 'center' });
            doc.text(volunteer.volunteer_name || 'N/A', leftMargin + columnWidths.no + 5, currentY + 5, { width: columnWidths.name - 5, ellipsis: true });
            doc.text(volunteer.volunteer_email || 'N/A', leftMargin + columnWidths.no + columnWidths.name + 5, currentY + 5, { width: columnWidths.email - 5, ellipsis: true });
            doc.text(volunteer.volunteer_phone || 'N/A', leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + 5, currentY + 5, { width: columnWidths.phone - 5 });
            doc.text(volunteer.enrollment_date || 'N/A', leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + columnWidths.phone + 5, currentY + 5, { width: columnWidths.date - 5, ellipsis: true });
            doc.text(this.translateEnrollmentStatus(volunteer.status), leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + columnWidths.phone + columnWidths.date + 5, currentY + 5, { width: columnWidths.status - 5 });

            currentY += rowHeight;
        });

        // Borde final de la tabla
        doc.rect(leftMargin, tableTop, 510, currentY - tableTop)
            .stroke('#cccccc');
    }

    private generateAttendanceTable(doc: PDFDoc, attendees: VolunteerEnrollmentInfo[]): void {
        const tableTop = doc.y;
        let currentY = tableTop;
        const leftMargin = 50;
        const columnWidths = {
            no: 30,
            name: 150,
            email: 170,
            date: 90
        };

        // Header de la tabla
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF');

        doc.rect(leftMargin, currentY, 440, 20)
            .fill('#27ae60');

        doc.fillColor('#FFFFFF');
        doc.text('N°', leftMargin + 5, currentY + 5, { width: columnWidths.no, align: 'center' });
        doc.text('Nombre', leftMargin + columnWidths.no + 5, currentY + 5, { width: columnWidths.name });
        doc.text('Email', leftMargin + columnWidths.no + columnWidths.name + 5, currentY + 5, { width: columnWidths.email });
        doc.text('Fecha Asistencia', leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + 5, currentY + 5, { width: columnWidths.date });

        currentY += 25;

        // Filas
        attendees.forEach((attendee, index) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }

            const rowHeight = 20;
            const fillColor = index % 2 === 0 ? '#f8f9fa' : '#FFFFFF';

            doc.rect(leftMargin, currentY, 440, rowHeight)
                .fill(fillColor);

            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#000000');

            doc.text((index + 1).toString(), leftMargin + 5, currentY + 5, { width: columnWidths.no, align: 'center' });
            doc.text(attendee.volunteer_name || 'N/A', leftMargin + columnWidths.no + 5, currentY + 5, { width: columnWidths.name - 5, ellipsis: true });
            doc.text(attendee.volunteer_email || 'N/A', leftMargin + columnWidths.no + columnWidths.name + 5, currentY + 5, { width: columnWidths.email - 5, ellipsis: true });
            doc.text(attendee.attendance_date || 'N/A', leftMargin + columnWidths.no + columnWidths.name + columnWidths.email + 5, currentY + 5, { width: columnWidths.date - 5 });

            currentY += rowHeight;
        });

        doc.rect(leftMargin, tableTop, 440, currentY - tableTop)
            .stroke('#cccccc');
    }

    // ==================== MÉTODOS PRIVADOS PARA EXCEL ====================

    private createSummarySheet(workbook: XLSX.WorkBook, data: ActivityReportData): void {
        // TODO: Implementar hoja de resumen
        const summaryData: (string | number | boolean)[][] = [];

        summaryData.push(['REPORTE DE ACTIVIDAD']);
        summaryData.push([`Generado: ${new Date().toLocaleDateString('es-ES')}`]);
        summaryData.push([]);

        summaryData.push(['INFORMACIÓN GENERAL']);
        summaryData.push(['Campo', 'Valor']);
        summaryData.push(['Nombre', data.activity.Name]);
        summaryData.push(['Proyecto', data.activity.Project_name || 'N/A']);
        summaryData.push(['Descripción', data.activity.Description]);
        summaryData.push(['Objetivo', data.activity.Aim]);
        summaryData.push(['Ubicación', data.activity.Location]);
        summaryData.push(['Tipo', this.translateActivityType(data.activity.Type_activity)]);
        summaryData.push(['Estado', this.translateActivityStatus(data.activity.Status_activity)]);
        summaryData.push(['Enfoque', this.translateApproach(data.activity.Approach)]);
        summaryData.push(['Abierta a Inscripción', data.activity.OpenForRegistration ? 'Sí' : 'No']);
        summaryData.push(['Fecha Inicio', data.activity.Start_date || 'N/A']);
        summaryData.push(['Fecha Fin', data.activity.End_date || 'N/A']);
        // TODO: Agregar más campos

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 30 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
    }

    private createVolunteersSheet(workbook: XLSX.WorkBook, data: ActivityReportData): void {
        // TODO: Implementar hoja de voluntarios
        const volunteersData: (string | number | boolean)[][] = [];

        volunteersData.push(['LISTA DE VOLUNTARIOS INSCRITOS']);
        volunteersData.push([`Total: ${data.enrollments.volunteers.length}`]);
        volunteersData.push([]);

        volunteersData.push([
            'N°',
            'Nombre',
            'Email',
            'Teléfono',
            'Fecha Inscripción',
            'Estado',
            'Fecha Asistencia'
        ]);

        data.enrollments.volunteers.forEach((volunteer, index) => {
            volunteersData.push([
                index + 1,
                volunteer.volunteer_name,
                volunteer.volunteer_email,
                volunteer.volunteer_phone,
                volunteer.enrollment_date,
                this.translateEnrollmentStatus(volunteer.status),
                volunteer.attendance_date || 'N/A'
            ]);
        });

        const volunteersSheet = XLSX.utils.aoa_to_sheet(volunteersData);
        volunteersSheet['!cols'] = [
            { wch: 5 },
            { wch: 30 },
            { wch: 30 },
            { wch: 15 },
            { wch: 20 },
            { wch: 15 },
            { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, volunteersSheet, 'Voluntarios');
    }

    private createStatisticsSheet(workbook: XLSX.WorkBook, data: ActivityReportData): void {
        // TODO: Implementar hoja de estadísticas
        const statsData: (string | number | boolean)[][] = [];

        statsData.push(['ESTADÍSTICAS DE LA ACTIVIDAD']);
        statsData.push([]);

        statsData.push(['Métrica', 'Valor']);
        statsData.push(['Total Voluntarios', data.statistics.total_volunteers]);
        statsData.push(['Asistencia', data.statistics.attendance_rate]);
        statsData.push(['Cancelación', data.statistics.cancellation_rate]);
        statsData.push(['Confirmaciones Pendientes', data.statistics.pending_confirmations]);
        statsData.push([]);

        statsData.push(['DISTRIBUCIÓN POR ESTADO']);
        statsData.push(['Estado', 'Cantidad']);
        statsData.push(['Inscritos', data.enrollments.total_enrolled]);
        statsData.push(['Asistieron', data.enrollments.total_attended]);
        statsData.push(['No Asistieron', data.enrollments.total_not_attended]);
        statsData.push(['Cancelaron', data.enrollments.total_cancelled]);

        const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
        statsSheet['!cols'] = [{ wch: 35 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas');
    }

    private createAttendanceSheet(workbook: XLSX.WorkBook, data: ActivityReportData): void {
        // TODO: Implementar hoja de asistencia
        const attendanceData: (string | number | boolean)[][] = [];

        attendanceData.push(['REGISTRO DE ASISTENCIA']);
        attendanceData.push([]);

        const attendees = data.enrollments.volunteers.filter(v => v.status === 'attended');

        attendanceData.push(['N°', 'Nombre', 'Email', 'Fecha Asistencia']);

        attendees.forEach((volunteer, index) => {
            attendanceData.push([
                index + 1,
                volunteer.volunteer_name,
                volunteer.volunteer_email,
                volunteer.attendance_date || 'N/A'
            ]);
        });

        const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceData);
        attendanceSheet['!cols'] = [
            { wch: 5 },
            { wch: 30 },
            { wch: 30 },
            { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Asistencia');
    }

    // ==================== MÉTODOS DE TRADUCCIÓN ====================

    private translateActivityType(type: string): string {
        const translations = {
            'conference': 'Conferencia',
            'workshop': 'Taller',
            'reforestation': 'Reforestación',
            'garbage_collection': 'Recolección de Basura',
            'special_event': 'Evento Especial',
            'cleanup': 'Limpieza',
            'cultural_event': 'Evento Cultural'
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

    private translateEnrollmentStatus(status: string): string {
        const translations = {
            'enrolled': 'Inscrito',
            'attended': 'Asistió',
            'not_attended': 'No Asistió',
            'cancelled': 'Cancelado'
        };
        return translations[status] || status;
    }
}

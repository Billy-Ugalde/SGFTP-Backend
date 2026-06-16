import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Buffer } from 'buffer';
import { AuditLog } from '../entities/audit-log.entity';
import { QueryAuditDto } from '../dto/query-audit.dto';
import { IAuditService } from './interfaces/audit.interface';
import * as PDFDocument from 'pdfkit';

type PDFDoc = PDFDocument;

@Injectable()
export class AuditService implements IAuditService {

    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
    ) {}

    async findAll(query: QueryAuditDto): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
        const page  = query.page  ?? 1;
        const limit = query.limit ?? 9;
        const skip  = (page - 1) * limit;

        const qb = this.buildQuery(query).skip(skip).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total, page, limit };
    }

    async getStats(): Promise<{ total_events: number; role_changes: number; events_today: number }> {
        const today    = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

        const [total_events, role_changes, events_today] = await Promise.all([
            this.auditRepo.count(),
            this.auditRepo.count({ where: [{ action: 'ROLE_ASSIGNED' as any }, { action: 'ROLE_REMOVED' as any }] }),
            this.auditRepo.count({ where: { timestamp: Between(today, tomorrow) } }),
        ]);

        return { total_events, role_changes, events_today };
    }

    async generatePdfById(id: number): Promise<Buffer> {
        const record = await this.auditRepo.createQueryBuilder('audit')
            .leftJoinAndSelect('audit.user', 'user')
            .leftJoinAndSelect('user.person', 'person')
            .where('audit.id = :id', { id })
            .getOne();

        if (!record) throw new NotFoundException(`Registro ${id} no encontrado`);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                });
                const buffers: Buffer[] = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                this.generateSingleRecordPDFContent(doc, record);
                doc.end();
            } catch (error) { reject(error); }
        });
    }

    async generatePdf(query: QueryAuditDto): Promise<Buffer> {
        const records = await this.fetchAllForReport(query);

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'LETTER',
                    margins: { top: 50, bottom: 50, left: 50, right: 50 },
                });

                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });

                this.generatePDFContent(doc, records, query);
                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    private async fetchAllForReport(query: QueryAuditDto): Promise<AuditLog[]> {
        return this.buildQuery(query).getMany();
    }

    private buildQuery(query: QueryAuditDto) {
        const where: FindOptionsWhere<AuditLog> = {};
        if (query.entity)  where.entity  = query.entity;
        if (query.action)  where.action  = query.action;
        if (query.user_id) where.user_id = query.user_id;

        if (query.date_from || query.date_to) {
            const from = new Date(`${query.date_from ?? '2000-01-01'}T00:00:00`);
            const toBase = query.date_to ?? (() => {
                const n = new Date();
                return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
            })();
            where.timestamp = Between(from, new Date(`${toBase}T23:59:59.999`));
        }

        const qb = this.auditRepo.createQueryBuilder('audit')
            .leftJoinAndSelect('audit.user', 'user')
            .leftJoinAndSelect('user.person', 'person')
            .leftJoin('user.roles', 'role')
            .where(where)
            .orderBy('audit.timestamp', 'DESC');

        if (query.user_role) {
            qb.andWhere('role.name = :user_role', { user_role: query.user_role });
        }

        if (query.search) {
            qb.andWhere('audit.user_email LIKE :q', { q: `%${query.search}%` });
        }

        return qb;
    }

    private generateSingleRecordPDFContent(doc: PDFDoc, record: AuditLog): void {
        // Encabezado
        doc.fontSize(18).font('Helvetica-Bold')
            .text('DETALLE DE REGISTRO DE AUDITORÍA', { align: 'center' })
            .moveDown(0.3);
        doc.fontSize(11).font('Helvetica')
            .text('Fundación Tamarindo Park · SGTPF', { align: 'center' })
            .moveDown(0.3);
        doc.fontSize(10)
            .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' })
            .moveDown(1.5);

        // Usuario
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50').text('USUARIO').moveDown(0.5);
        doc.fillColor('#000000');
        const userName = record.user?.person
            ? `${record.user.person.first_name} ${record.user.person.first_lastname}`
            : record.user_email ?? (record.user_id ? `Usuario #${record.user_id}` : 'Sistema');
        this.addField(doc, 'Nombre:', userName);
        if (record.user_email) this.addField(doc, 'Email:', record.user_email);
        if (record.user_roles?.length) this.addField(doc, 'Roles:', record.user_roles.join(', '));
        doc.moveDown(1);

        // Evento
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50').text('EVENTO').moveDown(0.5);
        doc.fillColor('#000000');
        this.addField(doc, 'Módulo:', this.translateModule(record.entity));
        this.addField(doc, 'Acción:', this.translateAction(record.action));
        if (record.entity_id) this.addField(doc, 'ID del registro afectado:', record.entity_id);
        this.addField(doc, 'Fuente:', this.translateSource(record.source));
        this.addField(doc, 'Fecha y hora:', new Date(record.timestamp).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }));
        doc.moveDown(1);

        // Valor anterior
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50').text('VALOR ANTERIOR').moveDown(0.5);
        doc.fillColor('#000000');
        if (record.old_value && Object.keys(record.old_value).length > 0) {
            Object.entries(record.old_value).forEach(([k, v]) => this.addField(doc, `${this.translateField(k)}:`, this.translateValue(String(v ?? ''))));
        } else {
            doc.fontSize(10).font('Helvetica').text('Sin datos').moveDown(0.3);
        }
        doc.moveDown(1);

        // Valor nuevo
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50').text('VALOR NUEVO').moveDown(0.5);
        doc.fillColor('#000000');
        if (record.new_value && Object.keys(record.new_value).length > 0) {
            Object.entries(record.new_value).forEach(([k, v]) => this.addField(doc, `${this.translateField(k)}:`, this.translateValue(String(v ?? ''))));
        } else {
            doc.fontSize(10).font('Helvetica').text('Sin datos').moveDown(0.3);
        }
    }

    private generatePDFContent(doc: PDFDoc, records: AuditLog[], query: QueryAuditDto): void {
        // ── Encabezado ───────────────────────────────────────────────────────
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .text('REPORTE DE AUDITORÍA DEL SISTEMA', { align: 'center' })
            .moveDown(0.3);

        doc.fontSize(11)
            .font('Helvetica')
            .text('Fundación Tamarindo Park · SGTPF', { align: 'center' })
            .moveDown(0.3);

        doc.fontSize(10)
            .text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' })
            .moveDown(1.5);

        // ── Resumen de filtros ────────────────────────────────────────────────
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('RESUMEN DEL REPORTE')
            .moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000');

        this.addField(doc, 'Total de registros:', records.length.toString());
        if (query.entity)    this.addField(doc, 'Módulo:', this.translateModule(query.entity));
        if (query.action)    this.addField(doc, 'Acción:', this.translateAction(query.action));
        if (query.date_from) this.addField(doc, 'Desde:', query.date_from);
        if (query.date_to)   this.addField(doc, 'Hasta:', query.date_to);
        if (!query.entity && !query.action && !query.date_from && !query.date_to) {
            this.addField(doc, 'Filtros:', 'Sin filtros — todos los registros');
        }

        doc.moveDown(1.5);

        // ── Tabla de registros ────────────────────────────────────────────────
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50')
            .text('DETALLE DE REGISTROS')
            .moveDown(1);

        const leftMargin  = 50;
        const colWidths   = { no: 25, user: 130, module: 80, action: 100, date: 115 };

        const drawTableHeader = (y: number) => {
            doc.rect(leftMargin, y, 510, 20).fill('#2c3e50');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            let x = leftMargin + 3;
            doc.text('N°',      x, y + 6, { width: colWidths.no });     x += colWidths.no;
            doc.text('Usuario', x, y + 6, { width: colWidths.user });   x += colWidths.user;
            doc.text('Módulo',  x, y + 6, { width: colWidths.module }); x += colWidths.module;
            doc.text('Acción',  x, y + 6, { width: colWidths.action }); x += colWidths.action;
            doc.text('Fecha y Hora', x, y + 6, { width: colWidths.date });
            return y + 20;
        };

        let currentY = drawTableHeader(doc.y);

        records.forEach((record, index) => {
            if (currentY > 680) {
                doc.addPage();
                currentY = 50;
                currentY = drawTableHeader(currentY);
            }

            const rowHeight  = 18;
            const fillColor  = index % 2 === 0 ? '#f8f9fa' : '#FFFFFF';

            doc.rect(leftMargin, currentY, 510, rowHeight).fill(fillColor);

            doc.fillColor('#000000').fontSize(8).font('Helvetica');

            const userName = record.user?.person
                ? `${record.user.person.first_name} ${record.user.person.first_lastname}`
                : record.user_email
                    ?? (record.user_id ? `Usuario #${record.user_id}` : 'Sistema');

            const datetime = new Date(record.timestamp).toLocaleString('es-ES', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });

            let x = leftMargin + 3;
            doc.text((index + 1).toString(),               x, currentY + 5, { width: colWidths.no });     x += colWidths.no;
            doc.text(userName,                             x, currentY + 5, { width: colWidths.user - 3, ellipsis: true });   x += colWidths.user;
            doc.text(this.translateModule(record.entity),  x, currentY + 5, { width: colWidths.module - 3 }); x += colWidths.module;
            doc.text(this.translateAction(record.action),  x, currentY + 5, { width: colWidths.action - 3 }); x += colWidths.action;
            doc.text(datetime,                             x, currentY + 5, { width: colWidths.date - 3 });

            currentY += rowHeight;
        });

        // Borde final de la tabla
        doc.rect(leftMargin, doc.y - (records.length % 1) , 510, 1)
            .strokeColor('#cccccc').stroke();
    }

    private addField(doc: PDFDoc, label: string, value: string, fontSize: number = 10): void {
        doc.fontSize(fontSize)
            .font('Helvetica-Bold')
            .text(label, { continued: true })
            .font('Helvetica')
            .text(` ${value}`)
            .moveDown(0.3);
    }

    private translateField(key: string): string {
        const map: Record<string, string> = {
            // ── Comunes ──────────────────────────────────────────────────
            id: 'ID', name: 'Nombre', status: 'Estado', active: 'Activo',
            description: 'Descripción', location: 'Ubicación',
            created_at: 'Creado en', updated_at: 'Actualizado en',
            createdAt: 'Creado en', updatedAt: 'Actualizado en',
            registration_date: 'Fecha de registro', Registration_date: 'Fecha de registro',
            Update_date: 'Fecha de actualización', UpdatedAt: 'Actualizado en',
            image_url: 'URL de imagen',
            url_1: 'URL 1', url_2: 'URL 2', url_3: 'URL 3',
            url_4: 'URL 4', url_5: 'URL 5', url_6: 'URL 6',
            url1: 'URL 1', url2: 'URL 2', url3: 'URL 3',
            // ── Ferias ───────────────────────────────────────────────────
            date: 'Fecha', typeFair: 'Tipo de feria',
            stand_capacity: 'Capacidad de stands', conditions: 'Condiciones',
            archived: 'Archivada', stand_code: 'Código de stand',
            // ── Inscripciones ────────────────────────────────────────────
            id_activity: 'ID de actividad', id_volunteer: 'ID de voluntario',
            enrollment_date: 'Fecha de inscripción', attendance_date: 'Fecha de asistencia',
            // ── Emprendedores ────────────────────────────────────────────
            experience: 'Experiencia', is_active: 'Activo',
            facebook_url: 'Facebook', instagram_url: 'Instagram',
            id_entrepreneur: 'ID de emprendedor', id_person: 'ID de persona',
            category: 'Categoría', approach: 'Enfoque',
            // ── Voluntarios / buzón ──────────────────────────────────────
            Organization: 'Organización', Description: 'Descripción', Affair: 'Asunto',
            Hour_volunteer: 'Horas de voluntario',
            Document1: 'Documento 1', Document2: 'Documento 2', Document3: 'Documento 3',
            // ── Proyectos ────────────────────────────────────────────────
            Name: 'Nombre', Slug: 'Slug', Observations: 'Observaciones', Aim: 'Objetivo',
            Start_date: 'Fecha de inicio', End_date: 'Fecha de fin',
            Target_population: 'Población objetivo', Active: 'Activo', Status: 'Estado',
            METRIC_TOTAL_BENEFICIATED: 'Total beneficiados',
            METRIC_TOTAL_WASTE_COLLECTED: 'Residuos recolectados (kg)',
            METRIC_TOTAL_TREES_PLANTED: 'Árboles plantados',
            // ── Actividades ──────────────────────────────────────────────
            Conditions: 'Condiciones', IsRecurring: 'Recurrente', IsFavorite: 'Favorita',
            OpenForRegistration: 'Inscripción abierta', Type_activity: 'Tipo de actividad',
            Status_activity: 'Estado de actividad', Approach: 'Enfoque', Spaces: 'Espacios',
            Location: 'Ubicación', Metric_activity: 'Métrica',
            Total_metric_value: 'Valor total de métrica',
            Enrolled_count: 'Inscritos', Available_spaces: 'Espacios disponibles', Value: 'Valor',
            // ── Donaciones ───────────────────────────────────────────────
            donationType: 'Tipo de donación', donationDetails: 'Detalles de donación',
            donor: 'Donante', amount: 'Monto', currency: 'Moneda',
            firstName: 'Nombre', secondName: 'Segundo nombre',
            nameCompany: 'Nombre de empresa',
            firstLastName: 'Primer apellido', secondLastName: 'Segundo apellido',
            donorType: 'Tipo de donante', interest: 'Interés',
            email: 'Correo electrónico', phone: 'Teléfono',
            // ── Noticias ─────────────────────────────────────────────────
            title: 'Título', content: 'Contenido',
            publicationDate: 'Fecha de publicación', author: 'Autor',
            lastUpdated: 'Última actualización',
            // ── Newsletters ──────────────────────────────────────────────
            subject: 'Asunto', language: 'Idioma', sentAt: 'Enviado en',
            totalRecipients: 'Total de destinatarios',
            successfulSends: 'Envíos exitosos', failedSends: 'Envíos fallidos', errors: 'Errores',
            // ── Usuarios ─────────────────────────────────────────────────
            isEmailVerified: 'Email verificado',
            failedLoginAttempts: 'Intentos de inicio de sesión fallidos',
            activation_token: 'Token de activación', activation_expires: 'Expiración de activación',
            reset_token: 'Token de restablecimiento', reset_expires: 'Expiración de restablecimiento',
            role: 'Rol', roles: 'Roles',
            // ── Informativo ──────────────────────────────────────────────
            address: 'Dirección', whatsapp_url: 'WhatsApp',
            youtube_url: 'YouTube', google_maps_url: 'Google Maps',
            page: 'Página', section: 'Sección', block_key: 'Clave de bloque',
            text_content: 'Contenido de texto',
            // ── Persona ──────────────────────────────────────────────────
            first_name: 'Nombre', second_name: 'Segundo nombre',
            first_lastname: 'Primer apellido', second_lastname: 'Segundo apellido',
            phone_primary: 'Teléfono principal', phone_secondary: 'Teléfono secundario',
            // ── Fechas ───────────────────────────────────────────────────
            start_date: 'Fecha de inicio', end_date: 'Fecha de fin',
        };
        return map[key] ?? key;
    }

    private translateValue(value: string): string {
        const map: Record<string, string> = {
            // ── Booleanos ────────────────────────────────────────────────
            '1': 'Sí', '0': 'No',
            // ── Estados generales ────────────────────────────────────────
            active: 'Activo', inactive: 'Inactivo',
            pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado',
            published: 'Publicado', draft: 'Borrador', archived: 'Archivado',
            completed: 'Completado', failed: 'Fallido', partial: 'Parcial',
            // ── Inscripciones de actividades ──────────────────────────────
            enrolled: 'Inscrito', attended: 'Asistió',
            not_attended: 'No asistió', cancelled: 'Cancelado',
            // ── Tipos de feria ────────────────────────────────────────────
            interna: 'Interna', externa: 'Externa',
            // ── Enfoques ─────────────────────────────────────────────────
            social: 'Social', cultural: 'Cultural', ambiental: 'Ambiental',
            // ── Tipos de donación / donante ───────────────────────────────
            monetary: 'Monetaria', 'in-kind': 'En especie', service: 'Servicio',
            individual: 'Individual', company: 'Empresa', anonymous: 'Anónimo',
            // ── Intereses de donante ──────────────────────────────────────
            conservation: 'Conservación', education: 'Educación',
            community: 'Comunidad', research: 'Investigación',
            // ── Idiomas ───────────────────────────────────────────────────
            spanish: 'Español', english: 'Inglés',
            // ── Fuentes ───────────────────────────────────────────────────
            SYSTEM: 'Sistema', HTTP_REQUEST: 'Solicitud HTTP',
            SCRIPT: 'Script', CRON: 'Tarea programada',
            // ── Categorías de emprendimiento ──────────────────────────────
            'Comida': 'Comida', 'Artesanía': 'Artesanía', 'Vestimenta': 'Vestimenta',
            'Accesorios': 'Accesorios', 'Decoración': 'Decoración',
            'Demostración': 'Demostración', 'Otra categoría': 'Otra categoría',
            // ── Estados de proyecto ───────────────────────────────────────
            planning: 'En planificación', 'in-progress': 'En progreso',
            on_hold: 'En pausa', cancelled_project: 'Cancelado', finished: 'Finalizado',
            // ── Roles ─────────────────────────────────────────────────────
            super_admin: 'Super administrador', general_admin: 'Administrador general',
            fair_admin: 'Administrador de ferias', content_admin: 'Administrador de contenido',
            auditor: 'Auditor', entrepreneur: 'Emprendedor', volunteer: 'Voluntario',
        };
        return map[value] ?? value;
    }

    private translateSource(source: string): string {
        const map: Record<string, string> = {
            SYSTEM: 'Sistema',
            HTTP_REQUEST: 'Solicitud HTTP',
            SCRIPT: 'Script',
            CRON: 'Tarea programada',
        };
        return map[source] ?? source;
    }

    private translateModule(entity: string): string {
        const map: Record<string, string> = {
            users: 'Usuarios', entrepreneurs: 'Emprendedores',
            entrepreneurships: 'Emprendedores', fair: 'Ferias',
            fair_enrollment: 'Ferias', project: 'Proyectos',
            activity: 'Actividades', activity_enrollment: 'Actividades',
            volunteers: 'Voluntarios', news: 'Noticias',
            content_blocks: 'Contenido', subscriber: 'Suscriptores',
            donation: 'Donaciones', newsletter_campaigns: 'Newsletters',
        };
        return map[entity] ?? entity;
    }

    private translateAction(action: string): string {
        const map: Record<string, string> = {
            INSERT: 'Creación', UPDATE: 'Edición',
            STATUS_CHANGE: 'Cambio de estado', DELETE: 'Eliminación',
            ROLE_ASSIGNED: 'Asignación de rol', ROLE_REMOVED: 'Remoción de rol',
            EXPORT: 'Exportación',
        };
        return map[action] ?? action;
    }
}

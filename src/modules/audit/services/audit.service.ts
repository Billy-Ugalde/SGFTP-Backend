import { Injectable } from '@nestjs/common';
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
            const to = new Date(`${toBase}T23:59:59.999`);
            where.timestamp = Between(from, to);
        }

        const qb = this.auditRepo.createQueryBuilder('audit')
            .leftJoinAndSelect('audit.user', 'user')
            .leftJoinAndSelect('user.person', 'person')
            .where(where)
            .orderBy('audit.timestamp', 'DESC')
            .skip(skip)
            .take(limit);

        if (query.search) {
            qb.andWhere('audit.user_email LIKE :q', { q: `%${query.search}%` });
        }

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
            .where(where)
            .orderBy('audit.timestamp', 'DESC');

        if (query.search) {
            qb.andWhere('audit.user_email LIKE :q', { q: `%${query.search}%` });
        }

        return qb.getMany();
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
                : record.user_email ?? 'Sistema';

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

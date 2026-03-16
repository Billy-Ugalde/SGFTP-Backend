import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { QueryAuditDto } from '../dto/query-audit.dto';
import { IAuditService } from './interfaces/audit.interface';

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

        if (query.date_from && query.date_to) {
            where.timestamp = Between(new Date(query.date_from), new Date(query.date_to));
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

    async generatePdf(_query: QueryAuditDto): Promise<Buffer> {
        // TODO: implementar generación de reporte PDF
        return Buffer.alloc(0);
    }
}

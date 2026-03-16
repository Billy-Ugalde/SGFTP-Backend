import { AuditLog } from '../../entities/audit-log.entity';
import { QueryAuditDto } from '../../dto/query-audit.dto';

export interface IAuditService {
  findAll(query: QueryAuditDto): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }>;
  getStats(): Promise<{ total_events: number; role_changes: number; events_today: number }>;
  generatePdf(query: QueryAuditDto): Promise<Buffer>;
}

import { AsyncLocalStorage } from 'async_hooks';

export interface AuditUserContext {
    userId: number | null;
    userEmail: string | null;
}

export const auditStorage = new AsyncLocalStorage<AuditUserContext>();

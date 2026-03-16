import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    RemoveEvent,
    QueryRunner,
} from 'typeorm';
import { auditStorage } from '../audit-context';

@EventSubscriber()
export class AuditContextSubscriber implements EntitySubscriberInterface {

    private async setContext(queryRunner: QueryRunner | undefined): Promise<void> {
        if (!queryRunner) return;
        const ctx = auditStorage.getStore();
        if (!ctx) return;

        await queryRunner.query('SET @audit_user_id = ?',    [ctx.userId]);
        await queryRunner.query('SET @audit_user_email = ?', [ctx.userEmail]);
    }

    async beforeInsert(event: InsertEvent<any>): Promise<void> {
        await this.setContext(event.queryRunner);
    }

    async beforeUpdate(event: UpdateEvent<any>): Promise<void> {
        await this.setContext(event.queryRunner);
    }

    async beforeRemove(event: RemoveEvent<any>): Promise<void> {
        await this.setContext(event.queryRunner);
    }
}

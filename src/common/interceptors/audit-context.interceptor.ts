import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { auditStorage, AuditUserContext } from '../audit-context';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        const ctx: AuditUserContext = {
            userId:    user?.id_user       ?? null,
            userEmail: user?.person?.email ?? null,
        };

        return new Observable(observer => {
            auditStorage.run(ctx, () => {
                next.handle().subscribe(observer);
            });
        });
    }
}

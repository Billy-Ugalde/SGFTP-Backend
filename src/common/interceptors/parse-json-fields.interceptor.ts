import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ParseJsonFieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body) {
      const jsonFields = ['dates', 'dateActivities'];
      
      jsonFields.forEach(field => {
        if (request.body[field] && typeof request.body[field] === 'string') {
          try {
            request.body[field] = JSON.parse(request.body[field]);
          } catch (error) {
            throw new BadRequestException(`Invalid JSON in field: ${field}`);
          }
        }
      });
      
      const booleanFields = ['Active', 'OpenForRegistration', 'IsRecurring'];
      booleanFields.forEach(field => {
        if (request.body[field] !== undefined) {
          if (typeof request.body[field] === 'string') {
            request.body[field] = request.body[field] === 'true';
          } else {
            request.body[field] = Boolean(request.body[field]);
          }
        }
      });
      
      const numberFields = ['Id_project', 'Spaces', 'Metric_value'];
      numberFields.forEach(field => {
        if (request.body[field] !== undefined && request.body[field] !== null && request.body[field] !== '') {
          const numValue = Number(request.body[field]);
          if (!isNaN(numValue)) {
            request.body[field] = numValue;
          }
        }
      });

      if (request.body.IsFavorite === '' || request.body.IsFavorite === 'undefined' || request.body.IsFavorite === null) {
        delete request.body.IsFavorite;
      }
    }
    
    return next.handle();
  }
}
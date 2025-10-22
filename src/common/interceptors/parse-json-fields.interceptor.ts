import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { plainToClass } from 'class-transformer';
import { ValueDto } from '../../modules/projects/dto/createActivity.dto';

@Injectable()
export class ParseJsonFieldsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body) {
      const jsonFields = ['dates', 'dateActivities', 'values'];

      jsonFields.forEach(field => {
        if (request.body[field] && typeof request.body[field] === 'string') {
          try {
            request.body[field] = JSON.parse(request.body[field]);

            if (field === 'values' && Array.isArray(request.body[field])) {
              request.body[field] = request.body[field].map((item: any) => {
                const transformedItem = {
                  ...item,
                  Value: item.Value !== undefined ? Number(item.Value) : 0
                };
                return plainToClass(ValueDto, transformedItem);
              });
            }
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
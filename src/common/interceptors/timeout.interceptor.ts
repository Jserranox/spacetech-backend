import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { COMMON } from '../constants/common.constants';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const url = req?.url ?? '';

    if (url.includes('/documents') && req?.method === 'POST') {
      return next.handle();
    }

    return next.handle().pipe(
      timeout(COMMON.REQUEST_TIMEOUT_MS),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException(
            'La petición excedió el tiempo límite',
          );
        }
        throw err;
      }),
    );
  }
}

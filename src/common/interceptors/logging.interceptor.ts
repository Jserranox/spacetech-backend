import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { COMMON } from '../constants/common.constants';
import { sanitizeForLog } from '../utils/sanitize.util';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context
      .switchToHttp()
      .getRequest<Request & { correlationId?: string }>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, url } = req;

    if (url?.startsWith('/health')) return next.handle();

    const correlationId: string =
      req.correlationId ??
      (req.headers[COMMON.CORRELATION_ID_HEADER] as string) ??
      randomUUID();

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `${method} ${url} ${res.statusCode} +${duration}ms [${correlationId}]`,
        );
      }),
      catchError((err: Error) => {
        const duration = Date.now() - startTime;
        const safe = sanitizeForLog({
          correlationId,
          method,
          path: url,
          duration,
        });
        this.logger.error(
          `${method} ${url} ERROR +${duration}ms [${correlationId}]`,
          JSON.stringify(safe),
        );
        throw err;
      }),
    );
  }
}

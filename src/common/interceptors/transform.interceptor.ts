import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { IApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  IApiResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IApiResponse<T> | T> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const url = req?.url ?? '';

    if (url.startsWith('/health')) return next.handle();

    return next.handle().pipe(
      map((data: T) => {
        const contentType = (res.getHeader('content-type') as string) ?? '';
        if (contentType.includes('text/event-stream')) return data;

        if (data === null || data === undefined) {
          return {
            success: true,
            data: null,
            timestamp: new Date().toISOString(),
          };
        }

        if (this.isPaginatedShape(data)) {
          const paginated = data as unknown as {
            data: unknown;
            meta: Record<string, unknown>;
          };
          return {
            success: true,
            data: paginated.data,
            meta: paginated.meta,
            timestamp: new Date().toISOString(),
          } as IApiResponse<T>;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private isPaginatedShape(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'data' in data &&
      'meta' in data &&
      Array.isArray((data as { data: unknown }).data)
    );
  }
}

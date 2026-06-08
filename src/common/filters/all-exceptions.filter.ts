import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { IErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { correlationId?: string }>();

    const path = req?.url ?? 'unknown';
    const correlationId = req?.correlationId;
    const isProd = process.env['NODE_ENV'] === 'production';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === 'object' && response !== null
          ? ((response as { message?: string | string[] }).message ??
            exception.message)
          : exception.message;
      error = exception.name;
      stack = exception.stack;
    } else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'La operación de base de datos no pudo completarse';
      error = 'Bad Request';
      stack = (exception as Error).stack;
    } else if (this.isEntityNotFoundError(exception)) {
      statusCode = HttpStatus.NOT_FOUND;
      message = 'Recurso no encontrado';
      error = 'Not Found';
      stack = (exception as Error).stack;
    } else if (exception instanceof Error) {
      stack = exception.stack;
    }

    this.logger.error(
      `[${correlationId ?? '-'}] ${req?.method ?? ''} ${path} → ${statusCode}`,
      stack,
    );

    const body: IErrorResponse & { debug?: string } = {
      success: false,
      statusCode,
      message,
      error,
      path,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    if (!isProd && stack) {
      body.debug = stack;
    }

    res.status(statusCode).json(body);
  }

  private isEntityNotFoundError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.constructor.name === 'EntityNotFoundError' ||
        exception.constructor.name === 'EntityPropertyNotFoundError')
    );
  }
}

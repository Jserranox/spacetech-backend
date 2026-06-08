import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IErrorResponse } from '../interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { correlationId?: string }>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const correlationId = req?.correlationId;

    let message: string | string[];
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const resp = exceptionResponse as { message?: string | string[] };
      message = resp.message ?? exception.message;
    } else {
      message = exception.message;
    }

    const body: IErrorResponse = {
      success: false,
      statusCode,
      message,
      error: exception.name,
      path: req?.url ?? 'unknown',
      timestamp: new Date().toISOString(),
      correlationId,
    };

    res.status(statusCode).json(body);
  }
}

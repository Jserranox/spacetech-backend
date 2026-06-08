import {
  IApiResponse,
  IErrorResponse,
} from '../interfaces/api-response.interface';

export class ApiResponseDto {
  static success<T>(data: T, meta?: Record<string, unknown>): IApiResponse<T> {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string | string[],
    statusCode: number,
    error: string,
    path: string,
    correlationId?: string,
  ): IErrorResponse {
    return {
      success: false,
      statusCode,
      message,
      error,
      path,
      timestamp: new Date().toISOString(),
      correlationId,
    };
  }
}

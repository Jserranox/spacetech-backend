import {
  PaginatedResponseDto,
  PaginationMeta,
} from '../dto/paginated-response.dto';
import { PaginationDto } from '../dto/pagination.dto';

export function paginate<T>(
  data: T[],
  total: number,
  dto: PaginationDto,
): PaginatedResponseDto<T> {
  return new PaginatedResponseDto<T>(data, total, dto.page, dto.limit);
}

export function buildMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

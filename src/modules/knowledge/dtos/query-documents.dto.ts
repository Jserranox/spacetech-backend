import { IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryDocumentsDto extends PaginationDto {
  @IsUUID()
  botId: string;
}

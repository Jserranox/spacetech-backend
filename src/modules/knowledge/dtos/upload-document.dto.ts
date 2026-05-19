import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class UploadDocumentDto {
  @IsUUID()
  botId: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}

import { IsUUID, IsUrl, IsString, IsOptional, MaxLength } from 'class-validator';

export class IngestUrlDto {
  @IsUUID()
  botId: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}

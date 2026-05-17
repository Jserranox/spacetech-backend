import { IsString, IsOptional, IsArray, IsDateString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

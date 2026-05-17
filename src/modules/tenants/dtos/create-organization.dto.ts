import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'slug can only contain lowercase letters, numbers, and hyphens' })
  slug?: string;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { MemberRole, ApiKey } from '@aero-agent/database';
import { ApiKeyService } from '../../auth/services/api-key.service';
import { CreateApiKeyDto } from '../../auth/dtos/create-api-key.dto';
import { ApiKeyResponseDto } from '../../auth/dtos/auth-response.dto';
import { Tenant } from '../decorators/tenant.decorator';
import { Roles } from '../decorators/roles.decorator';

@Controller('organizations/:orgId/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  list(@Tenant() orgId: string): Promise<Partial<ApiKey>[]> {
    return this.apiKeyService.listForUser(orgId);
  }

  @Post()
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  create(
    @Tenant() orgId: string,
    @Body() dto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeyService.create(orgId, dto);
  }

  @Delete(':keyId')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Tenant() orgId: string,
    @Param('keyId') keyId: string,
  ): Promise<void> {
    return this.apiKeyService.revoke(keyId, orgId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemberRole } from '@aero-agent/database';
import { Roles } from '../../tenants/decorators/roles.decorator';
import { Tenant } from '../../tenants/decorators/tenant.decorator';
import { WebhooksService } from '../services/webhooks.service';
import { CreateWebhookDto } from '../dtos/create-webhook.dto';
import { UpdateWebhookDto } from '../dtos/update-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  create(@Tenant() orgId: string, @Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(orgId, dto);
  }

  @Get()
  findAll(@Tenant() orgId: string) {
    return this.webhooksService.findAll(orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Tenant() orgId: string) {
    return this.webhooksService.findOne(id, orgId);
  }

  @Patch(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  update(
    @Param('id') id: string,
    @Tenant() orgId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(id, orgId, dto);
  }

  @Patch(':id/toggle')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  toggleActive(
    @Param('id') id: string,
    @Tenant() orgId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.webhooksService.toggleActive(id, orgId, isActive);
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string, @Tenant() orgId: string) {
    await this.webhooksService.softDelete(id, orgId);
  }
}

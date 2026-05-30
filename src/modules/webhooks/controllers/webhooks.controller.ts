import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { MemberRole } from '@aero-agent/database';
import { WebhooksService } from '../services/webhooks.service';
import { CreateWebhookDto } from '../dto/create-webhook.dto';
import { UpdateWebhookDto } from '../dto/update-webhook.dto';
import { Roles } from '../../tenants/decorators/roles.decorator';

type OrgRequest = Request & { organizationId: string };

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  create(@Req() req: OrgRequest, @Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(req.organizationId, dto);
  }

  @Get()
  findAll(@Req() req: OrgRequest) {
    return this.webhooksService.findAll(req.organizationId);
  }

  @Get(':id')
  findOne(@Req() req: OrgRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.webhooksService.findOne(id, req.organizationId);
  }

  @Patch(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  update(
    @Req() req: OrgRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(id, req.organizationId, dto);
  }

  @Patch(':id/toggle')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  toggle(
    @Req() req: OrgRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.webhooksService.toggleActive(id, req.organizationId, isActive);
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: OrgRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.webhooksService.softDelete(id, req.organizationId);
  }
}

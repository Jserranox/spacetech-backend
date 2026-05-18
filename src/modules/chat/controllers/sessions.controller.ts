import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from '../services/sessions.service';
import { CreateSessionDto } from '../dtos/create-session.dto';
import { Tenant } from '../../tenants/decorators/tenant.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @Tenant() orgId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.create(dto.botId, userId, orgId, dto.metadata);
  }

  @Get()
  findForUser(
    @Tenant() orgId: string,
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sessionsService.findForUser(userId, orgId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Tenant() orgId: string) {
    return this.sessionsService.findOne(id, orgId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  close(@Param('id') id: string, @Tenant() orgId: string) {
    return this.sessionsService.close(id, orgId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MemberRole } from '@aero-agent/database';
import { BotsService } from '../services/bots.service';
import { BotCacheService } from '../services/bot-cache.service';
import { CreateBotDto } from '../dtos/create-bot.dto';
import { UpdateBotDto } from '../dtos/update-bot.dto';
import { QueryBotsDto } from '../dtos/query-bots-dto';
import { Tenant } from '../../tenants/decorators/tenant.decorator';
import { Roles } from '../../tenants/decorators/roles.decorator';

@Controller('bots')
export class BotsController {
  constructor(
    private readonly botsService: BotsService,
    private readonly botCacheService: BotCacheService,
  ) {}

  @Post()
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  create(@Tenant() orgId: string, @Body() dto: CreateBotDto) {
    return this.botsService.create(orgId, dto);
  }

  @Get()
  findAll(@Tenant() orgId: string, @Query() query: QueryBotsDto) {
    return this.botsService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Tenant() orgId: string) {
    return this.botsService.findOne(id, orgId);
  }

  @Patch(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  async update(
    @Param('id') id: string,
    @Tenant() orgId: string,
    @Body() dto: UpdateBotDto,
  ) {
    await this.botCacheService.invalidate(id);
    return this.botsService.update(id, orgId, dto);
  }

  @Delete(':id')
  @Roles(MemberRole.ADMIN, MemberRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string, @Tenant() orgId: string) {
    await this.botCacheService.invalidate(id);
    await this.botsService.softDelete(id, orgId);
  }
}

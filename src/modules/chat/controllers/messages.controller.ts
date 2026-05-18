import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { QueryMessagesDto } from '../dtos/query-messages.dto';
import { Tenant } from '../../tenants/decorators/tenant.decorator';

@Controller('sessions')
export class MessagesController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id/messages')
  findBySession(
    @Param('id') id: string,
    @Tenant() orgId: string,
    @Query() query: QueryMessagesDto,
  ) {
    return this.chatService.getSessionMessages(id, orgId, query);
  }
}

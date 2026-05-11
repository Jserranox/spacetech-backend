import { Module } from '@nestjs/common';
import { ToolsService } from './services/tools.service';
import { ToolRegistryService } from './services/tool-registry.service';

@Module({
  providers: [ToolsService, ToolRegistryService]
})
export class ToolsModule {}

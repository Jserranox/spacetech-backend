import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ToolsService } from './services/tools.service';
import { ToolRegistryService, TOOLS_TOKEN } from './services/tool-registry.service';
import { NasaTool } from './tools/nasa.tool';
import { EsaTool } from './tools/esa.tool';
import { FaaTool } from './tools/faa.tool';
import { WebSearchTool } from './tools/web-search.tool';

@Module({
  imports: [ConfigModule],
  providers: [
    NasaTool,
    EsaTool,
    FaaTool,
    WebSearchTool,
    ToolRegistryService,
    ToolsService,
    {
      provide: TOOLS_TOKEN,
      useFactory: (nasa: NasaTool, esa: EsaTool, faa: FaaTool, web: WebSearchTool) => [
        nasa,
        esa,
        faa,
        web,
      ],
      inject: [NasaTool, EsaTool, FaaTool, WebSearchTool],
    },
  ],
  exports: [ToolsService, ToolRegistryService],
})
export class ToolsModule {}

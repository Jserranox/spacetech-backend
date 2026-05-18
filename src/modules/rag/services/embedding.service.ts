import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EMBEDDING_MODEL } from '../constants/rag.constants';

@Injectable()
export class EmbeddingService {
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({ apiKey: config.get<string>('OPENAI_API_KEY') });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.slice(0, 8000),
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map((t) => t.slice(0, 8000)),
    });
    return response.data.map((d) => d.embedding);
  }
}

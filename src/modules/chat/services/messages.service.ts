import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageRole } from '@aero-agent/database';
import { QueryMessagesDto } from '../dtos/query-messages.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,
  ) {}

  async create(
    sessionId: string,
    role: MessageRole,
    content: string,
    tokens?: number,
  ): Promise<Message> {
    const msg = this.msgRepo.create({
      sessionId,
      role,
      content,
      tokensInput: role === MessageRole.USER ? (tokens ?? null) : null,
      tokensOutput: role === MessageRole.ASSISTANT ? (tokens ?? null) : null,
    });
    return this.msgRepo.save(msg);
  }

  async findBySession(
    sessionId: string,
    query: QueryMessagesDto,
  ): Promise<Message[]> {
    const limit = query.limit ?? 50;

    const qb = this.msgRepo
      .createQueryBuilder('msg')
      .where('msg.sessionId = :sessionId', { sessionId })
      .orderBy('msg.createdAt', 'DESC')
      .take(limit);

    if (query.before) {
      const cursor = await this.msgRepo.findOne({
        where: { id: query.before },
        select: ['createdAt'],
      });
      if (cursor) {
        qb.andWhere('msg.createdAt < :before', { before: cursor.createdAt });
      }
    }

    const messages = await qb.getMany();
    return messages.reverse();
  }

  async getLastN(sessionId: string, n: number): Promise<Message[]> {
    const messages = await this.msgRepo
      .createQueryBuilder('msg')
      .where('msg.sessionId = :sessionId', { sessionId })
      .orderBy('msg.createdAt', 'DESC')
      .take(n)
      .getMany();

    return messages.reverse();
  }
}

export class StreamChunkDto {
  sessionId!: string;
  chunk!: string;
  isLast!: boolean;
  messageId?: string;
}

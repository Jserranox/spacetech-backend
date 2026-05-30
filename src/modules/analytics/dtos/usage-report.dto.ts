export class UsageReportDto {
  messagesPerMonth: number;
  documents: number;
  bots: number;
  apiKeys: number;
  members: number;
  period: { from: string; to: string };
}

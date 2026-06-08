export class UsageReportDto {
  messages: number;
  documents: number;
  bots: number;
  apiKeys: number;
  members: number;
  period: { from: string; to: string };
}

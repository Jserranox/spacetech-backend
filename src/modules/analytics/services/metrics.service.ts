import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MetricsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getMessageVolume(
    orgId: string,
    from: Date,
    to: Date,
    granularity: 'hour' | 'day' | 'week' = 'day',
  ): Promise<{ date: string; count: number }[]> {
    const rows = await this.dataSource.query<{ date: Date; count: string }[]>(
      `SELECT date_trunc($1, created_at) AS date, COUNT(*) AS count
       FROM analytics_events
       WHERE organization_id = $2
         AND event_type = 'message_sent'
         AND created_at BETWEEN $3 AND $4
       GROUP BY 1
       ORDER BY 1`,
      [granularity, orgId, from, to],
    );
    return rows.map((r) => ({ date: new Date(r.date).toISOString(), count: parseInt(r.count, 10) }));
  }

  async getActiveUsers(orgId: string, from: Date, to: Date): Promise<number> {
    const [row] = await this.dataSource.query<{ count: string }[]>(
      `SELECT COUNT(DISTINCT session_id) AS count
       FROM analytics_events
       WHERE organization_id = $1
         AND event_type = 'message_sent'
         AND session_id IS NOT NULL
         AND created_at BETWEEN $2 AND $3`,
      [orgId, from, to],
    );
    return parseInt(row?.count ?? '0', 10);
  }

  async getTopBots(
    orgId: string,
    from: Date,
    to: Date,
    limit = 10,
  ): Promise<{ botId: string; name: string; count: number }[]> {
    const rows = await this.dataSource.query<{ botId: string; name: string; count: string }[]>(
      `SELECT ae.bot_id AS "botId", b.name AS name, COUNT(*) AS count
       FROM analytics_events ae
       JOIN bots b ON b.id = ae.bot_id
       WHERE ae.organization_id = $1
         AND ae.event_type = 'message_sent'
         AND ae.created_at BETWEEN $2 AND $3
       GROUP BY ae.bot_id, b.name
       ORDER BY count DESC
       LIMIT $4`,
      [orgId, from, to, limit],
    );
    return rows.map((r) => ({ ...r, count: parseInt(r.count, 10) }));
  }

  async getResponseTimes(
    orgId: string,
    from: Date,
    to: Date,
  ): Promise<{ avg: number; p50: number; p95: number }> {
    const [row] = await this.dataSource.query<
      { avg: string | null; p50: string | null; p95: string | null }[]
    >(
      `SELECT
         COALESCE(AVG(latency_ms), 0)::integer AS avg,
         COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms), 0)::integer AS p50,
         COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::integer AS p95
       FROM analytics_events
       WHERE organization_id = $1
         AND event_type = 'message_sent'
         AND latency_ms IS NOT NULL
         AND created_at BETWEEN $2 AND $3`,
      [orgId, from, to],
    );
    return {
      avg: parseInt(row?.avg ?? '0', 10),
      p50: parseInt(row?.p50 ?? '0', 10),
      p95: parseInt(row?.p95 ?? '0', 10),
    };
  }

  async getDashboard(
    orgId: string,
    from: Date,
    to: Date,
    granularity: 'hour' | 'day' | 'week' = 'day',
  ): Promise<{
    messageVolume: { date: string; count: number }[];
    activeUsers: number;
    topBots: { botId: string; name: string; count: number }[];
    responseTimes: { avg: number; p50: number; p95: number };
  }> {
    const [messageVolume, activeUsers, topBots, responseTimes] = await Promise.all([
      this.getMessageVolume(orgId, from, to, granularity),
      this.getActiveUsers(orgId, from, to),
      this.getTopBots(orgId, from, to),
      this.getResponseTimes(orgId, from, to),
    ]);
    return { messageVolume, activeUsers, topBots, responseTimes };
  }
}

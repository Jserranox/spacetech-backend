import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsEventType } from '@aero-agent/database';

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
    const rows: { date: string; count: string }[] = await this.dataSource.query(
      `SELECT date_trunc($1, created_at) AS date, COUNT(*) AS count
       FROM analytics_events
       WHERE organization_id = $2
         AND event_type = $3
         AND created_at BETWEEN $4 AND $5
       GROUP BY 1
       ORDER BY 1`,
      [granularity, orgId, AnalyticsEventType.MESSAGE_SENT, from, to],
    );
    return rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) }));
  }

  async getActiveUsers(
    orgId: string,
    from: Date,
    to: Date,
  ): Promise<{ count: number }> {
    const rows: { count: string }[] = await this.dataSource.query(
      `SELECT COUNT(DISTINCT session_id) AS count
       FROM analytics_events
       WHERE organization_id = $1
         AND event_type IN ($2, $3)
         AND created_at BETWEEN $4 AND $5
         AND session_id IS NOT NULL`,
      [
        orgId,
        AnalyticsEventType.MESSAGE_SENT,
        AnalyticsEventType.SESSION_STARTED,
        from,
        to,
      ],
    );
    return { count: parseInt(rows[0]?.count ?? '0', 10) };
  }

  async getTopBots(
    orgId: string,
    from: Date,
    to: Date,
    limit = 10,
  ): Promise<{ botId: string; name: string; count: number }[]> {
    const rows: { botId: string; name: string; count: string }[] =
      await this.dataSource.query(
        `SELECT ae.bot_id AS "botId", b.name, COUNT(*) AS count
         FROM analytics_events ae
         JOIN bots b ON b.id = ae.bot_id
         WHERE ae.organization_id = $1
           AND ae.created_at BETWEEN $2 AND $3
         GROUP BY ae.bot_id, b.name
         ORDER BY count DESC
         LIMIT $4`,
        [orgId, from, to, limit],
      );
    return rows.map((r) => ({
      botId: r.botId,
      name: r.name,
      count: parseInt(r.count, 10),
    }));
  }

  async getResponseTimes(
    orgId: string,
    from: Date,
    to: Date,
  ): Promise<{ avg: number; p50: number; p95: number }> {
    const rows: { avg: string; p50: string; p95: string }[] =
      await this.dataSource.query(
        `SELECT
           AVG(latency_ms)::float AS avg,
           percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
           percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95
         FROM analytics_events
         WHERE organization_id = $1
           AND event_type = $2
           AND created_at BETWEEN $3 AND $4
           AND latency_ms IS NOT NULL`,
        [orgId, AnalyticsEventType.MESSAGE_SENT, from, to],
      );
    const r = rows[0] ?? { avg: '0', p50: '0', p95: '0' };
    return {
      avg: parseFloat(r.avg ?? '0'),
      p50: parseFloat(r.p50 ?? '0'),
      p95: parseFloat(r.p95 ?? '0'),
    };
  }

  async getDashboard(
    orgId: string,
    from: Date,
    to: Date,
    granularity: 'hour' | 'day' | 'week' = 'day',
  ): Promise<{
    messageVolume: { date: string; count: number }[];
    activeUsers: { count: number };
    topBots: { botId: string; name: string; count: number }[];
    responseTimes: { avg: number; p50: number; p95: number };
  }> {
    const [messageVolume, activeUsers, topBots, responseTimes] =
      await Promise.all([
        this.getMessageVolume(orgId, from, to, granularity),
        this.getActiveUsers(orgId, from, to),
        this.getTopBots(orgId, from, to),
        this.getResponseTimes(orgId, from, to),
      ]);
    return { messageVolume, activeUsers, topBots, responseTimes };
  }
}

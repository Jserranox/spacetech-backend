export const PLAN_LIMITS = {
  FREE:       { bots: 1,  documents: 5,   messagesPerMonth: 1_000,  apiKeys: 2,  members: 3  },
  PRO:        { bots: 10, documents: 100,  messagesPerMonth: 50_000, apiKeys: 10, members: 20 },
  ENTERPRISE: { bots: -1, documents: -1,   messagesPerMonth: -1,     apiKeys: -1, members: -1 },
} as const;

export type PlanLimitsKey = keyof typeof PLAN_LIMITS;
export type PlanLimitResource = keyof (typeof PLAN_LIMITS)[PlanLimitsKey];

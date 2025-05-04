// These types should be globally available via tsconfig types

export interface Env {
  AUTH_TOKEN: string;
  AI_GATEWAY_URL?: string; // Optional if AI binding is used directly
  AI: Ai; // Direct AI binding
  ACTIVITY_LOG_DB: D1Database; // D1 binding for logs
  ACTIVITY_SUMMARIES_BUCKET: R2Bucket; // R2 binding for summaries
}

export interface LogDataPayload {
  url: string;
  title?: string;
  startTimestamp: number;
  endTimestamp?: number;
  timeSpentSeconds?: number;
  maxScrollPercent?: number;
  textContent: string;
}

// These types should be globally available via tsconfig types

export interface Env {
  AUTH_TOKEN: string;
  AI_GATEWAY_URL?: string; // Optional if AI binding is used directly
  AI: Ai; // Direct AI binding
  ACTIVITY_LOG_DB: D1Database; // D1 binding for logs
  ACTIVITY_SUMMARIES_BUCKET: R2Bucket; // R2 binding for summaries
  VECTORIZE: VectorizeIndex; // Vectorize binding
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

export interface Vector {
  id: string;
  values: number[];
  metadata?: Record<string, any>; // Optional metadata
}

export interface VectorizeQueryOptions {
  topK?: number;
  returnValues?: boolean;
  filter?: Record<string, any>; // Simple filter example
}

export interface VectorMatch extends Vector {
  score: number;
}

export interface VectorizeMatches {
  matches: VectorMatch[];
  count?: number; // Total count of vectors in the index, if requested
}

export interface VectorizeUpsertResult {
  count: number;
  ids: string[];
}

// This is the main interface for the Vectorize binding
export interface VectorizeIndex {
  insert(vectors: Vector[]): Promise<VectorizeUpsertResult>;
  upsert(vectors: Vector[]): Promise<VectorizeUpsertResult>;
  query(vector: number[] | Vector, options?: VectorizeQueryOptions): Promise<VectorizeMatches>;
  getByIds(ids: string[]): Promise<Vector[]>;
  deleteByIds(ids: string[]): Promise<{ count: number }>; // Simplified delete result
  // describe(): Promise<VectorizeIndexDescription>; // If needed later
}

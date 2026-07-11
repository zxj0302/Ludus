// Web Worker 消息协议 — 求解/生成/AI 任务抽象

export type WorkerTaskType = 'solve' | 'generate' | 'ai-move';

export interface WorkerRequest {
  id: string;
  type: WorkerTaskType;
  payload: unknown;
}

export interface WorkerResponse {
  id: string;
  type: WorkerTaskType;
  result?: unknown;
  error?: string;
}

/** 求解任务的 payload */
export interface SolveTaskPayload {
  gameId: string;
  state: Record<string, unknown>;
}

/** 生成任务的 payload */
export interface GenerateTaskPayload {
  gameId: string;
  config: Record<string, unknown>;
}

/** AI 走子任务的 payload */
export interface AiMoveTaskPayload {
  gameId: string;
  state: Record<string, unknown>;
  budget?: {
    timeMs: number;
    maxDepth: number;
    maxPlaceBranch?: number;
  };
}

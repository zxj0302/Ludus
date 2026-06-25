// Web Worker 消息协议 — 求解/生成任务抽象

export type WorkerTaskType = 'solve' | 'generate';

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

/**
 * 检查计算是否应分流到 Worker。
 * 默认阈值：状态空间 > 25 格（5×5）时使用 Worker。
 */
export function shouldUseWorker(stateSize: number, threshold = 25): boolean {
  return stateSize > threshold;
}

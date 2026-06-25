import { z } from 'zod';

/**
 * 游戏状态快照 Schema v1
 * 用于保存/恢复游戏进度（localStorage / 文件）。
 */
export const GameStateSnapshotSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  gameId: z.string().min(1).max(64),
  /** 游戏特定状态数据 */
  state: z.record(z.string(), z.unknown()),
  /** 走子历史（允许撤销至任意历史状态） */
  moveHistory: z.array(z.record(z.string(), z.unknown())),
  /** 当前步数 */
  stepCount: z.number().int().nonnegative(),
  /** 保存时间 */
  timestamp: z.string().datetime(),
});

export type GameStateSnapshotV1 = z.infer<typeof GameStateSnapshotSchemaV1>;

export const GameStateSnapshotSchema = z.discriminatedUnion('schemaVersion', [
  GameStateSnapshotSchemaV1,
]);

export type GameStateSnapshot = z.infer<typeof GameStateSnapshotSchema>;

export const STATE_SCHEMA_VERSION = 1;

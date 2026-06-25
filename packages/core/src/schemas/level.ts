import { z } from 'zod';

/**
 * 关卡文件 Schema v1
 * 用于关卡文件的序列化/反序列化与导入导出。
 */
export const LevelSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  gameId: z.string().min(1).max(64),
  levelId: z.string().min(1).max(128),
  initialState: z.record(z.string(), z.unknown()),
  difficulty: z.object({
    score: z.number().min(0).max(100),
    factors: z.record(z.string(), z.number()),
    labelKey: z.string(),
  }),
  optimalSteps: z.number().int().nonnegative().nullable(),
  uniqueSolution: z.boolean(),
  generatedBy: z.string(),
  createdAt: z.string().datetime(),
});

export type LevelV1 = z.infer<typeof LevelSchemaV1>;

/**
 * 版本化关卡联合类型。
 * 通过 schemaVersion 字段分发到对应版本 schema。
 * 新增版本时在此追加 discriminated union 变体。
 */
export const LevelSchema = z.discriminatedUnion('schemaVersion', [LevelSchemaV1]);

export type Level = z.infer<typeof LevelSchema>;

/** 当前最新的 schema 版本号 */
export const LEVEL_SCHEMA_VERSION = 1;

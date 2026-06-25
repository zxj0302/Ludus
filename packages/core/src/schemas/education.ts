import { z } from 'zod';

/**
 * 五段式教学内容 Schema v1
 * 按 语言 × 深度 组织，存储在 Markdown 文件中。
 * 此 schema 用于验证内容结构的完整性（不验证 Markdown 本身）。
 */
export const EducationContentSchema = z.object({
  schemaVersion: z.literal(1),
  gameId: z.string(),
  depth: z.enum(['L2', 'L3']),
  locale: z.enum(['zh-CN', 'en']),
  sections: z.object({
    /** 阶段 1：玩 — 极简提示（仅新手引导时显示一次） */
    play: z
      .object({
        quickTip: z.string().optional(),
      })
      .optional(),
    /** 阶段 2：思考挑战 — 抛钩子问题引起好奇心 */
    think: z.object({
      hook: z.string(),
    }),
    /** 阶段 3：揭示抽象 — 形式化定义 + 复杂度归类 */
    reveal: z.object({
      formalDefinition: z.string(),
      complexityClass: z.string(),
      complexityJustification: z.string(),
    }),
    /** 阶段 4：求解器演示 — 算法说明（L3 含伪代码） */
    solve: z.object({
      algorithmName: z.string(),
      algorithmDescription: z.string(),
      pseudocode: z.string().optional(),
      complexityAnalysis: z.string(),
    }),
    /** 阶段 5：出题 — 生成器原理（仅 L3） */
    create: z
      .object({
        generationStrategy: z.string(),
        difficultyFactors: z.string(),
      })
      .optional(),
  }),
});

export type EducationContent = z.infer<typeof EducationContentSchema>;

export const EDUCATION_SCHEMA_VERSION = 1;

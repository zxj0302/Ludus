import { z } from 'zod';

/**
 * CHI / campaign Demo playlist schema v1.
 * Pure data contract — no UI. Validated at load time.
 */
export const DemoBeatSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('play'),
    narrationKey: z.string().min(1),
    durationHintSec: z.number().positive().optional(),
  }),
  z.object({
    type: z.literal('hint'),
    narrationKey: z.string().min(1),
  }),
  z.object({
    type: z.literal('solve'),
    narrationKey: z.string().min(1),
  }),
  z.object({
    type: z.literal('reveal'),
    narrationKey: z.string().min(1),
    depth: z.enum(['L2', 'L3']),
  }),
  z.object({
    type: z.literal('speak'),
    narrationKey: z.string().min(1),
  }),
]);

export const DemoLevelSeedSchema = z.object({
  seed: z.number().int(),
  difficultyRange: z.tuple([z.number(), z.number()]).optional(),
});

export const DemoLevelInlineSchema = z.object({
  initialState: z.record(z.string(), z.unknown()),
});

export const DemoLevelSchema = z.union([DemoLevelSeedSchema, DemoLevelInlineSchema]);

export const DemoActSchema = z.object({
  id: z.string().min(1).max(64),
  gameId: z.string().min(1).max(64),
  titleKey: z.string().min(1),
  level: DemoLevelSchema,
  beats: z.array(DemoBeatSchema).min(1),
});

export const DemoPlaylistSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).max(64),
  titleKey: z.string().min(1),
  defaultLocale: z.enum(['en', 'zh-CN']),
  acts: z.array(DemoActSchema).min(1).max(8),
});

export const DemoPlaylistSchema = z.discriminatedUnion('schemaVersion', [
  DemoPlaylistSchemaV1,
]);

export type DemoBeat = z.infer<typeof DemoBeatSchema>;
export type DemoLevel = z.infer<typeof DemoLevelSchema>;
export type DemoAct = z.infer<typeof DemoActSchema>;
export type DemoPlaylistV1 = z.infer<typeof DemoPlaylistSchemaV1>;
export type DemoPlaylist = z.infer<typeof DemoPlaylistSchema>;

export const DEMO_PLAYLIST_SCHEMA_VERSION = 1;

/** Parse and validate a playlist document; throws ZodError on failure. */
export function parseDemoPlaylist(data: unknown): DemoPlaylist {
  return DemoPlaylistSchema.parse(data);
}

export function isDemoLevelSeed(
  level: DemoLevel,
): level is z.infer<typeof DemoLevelSeedSchema> {
  return 'seed' in level;
}

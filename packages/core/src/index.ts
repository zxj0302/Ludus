// @ludus/core — 核心逻辑层 barrel export
// 注意：types 和 schemas 中都定义了 Level，这里显式管理导出避免冲突
export * from './types';
export {
  LevelSchema,
  LevelSchemaV1,
  LEVEL_SCHEMA_VERSION,
  GameStateSnapshotSchema,
  GameStateSnapshotSchemaV1,
  STATE_SCHEMA_VERSION,
  EducationContentSchema,
  EDUCATION_SCHEMA_VERSION,
  migrateData,
} from './schemas';
export type {
  LevelV1,
  GameStateSnapshotV1,
  GameStateSnapshot,
  EducationContent,
  SchemaMigrator,
} from './schemas';
export * from './solver';
export * from './generator';
export * from './difficulty';
export * from './worker';

export {
  LevelSchema,
  LevelSchemaV1,
  LEVEL_SCHEMA_VERSION,
} from './level';
export type { LevelV1, Level } from './level';

export {
  GameStateSnapshotSchema,
  GameStateSnapshotSchemaV1,
  STATE_SCHEMA_VERSION,
} from './state';
export type { GameStateSnapshotV1, GameStateSnapshot } from './state';

export {
  EducationContentSchema,
  EDUCATION_SCHEMA_VERSION,
} from './education';
export type { EducationContent } from './education';

export { migrateData } from './migrator';
export type { SchemaMigrator } from './migrator';

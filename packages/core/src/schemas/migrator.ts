/**
 * Schema 迁移框架
 *
 * 所有持久化数据均携带 schemaVersion 字段。
 * Core 层提供 migrator 将数据从旧版本升至最新版本，
 * 保证向前兼容，用户数据不因版本升级丢失。
 */

export interface SchemaMigrator<T = unknown> {
  /** 源版本号 */
  from: number;
  /** 目标版本号 */
  to: number;
  /** 迁移函数：接收旧版本数据，返回新版本数据 */
  migrate(data: T): T;
}

/**
 * 迁移管道：串联应用多个 migrator，将数据从旧版本升至目标版本。
 *
 * migrators 须按 from 版本升序排列。
 * 若找不到从当前版本出发的迁移链，抛出错误。
 *
 * @example
 * ```ts
 * const data = { schemaVersion: 1, ... };
 * const migrators = [v1toV2, v2toV3];
 * const latest = migrateData(data, 3, migrators);
 * ```
 */
export function migrateData<T extends { schemaVersion: number }>(
  data: T,
  targetVersion: number,
  migrators: SchemaMigrator<T>[],
): T {
  let current = data;

  while (current.schemaVersion < targetVersion) {
    const next = migrators.find((m) => m.from === current.schemaVersion);
    if (!next) {
      throw new Error(
        `No migrator found for schemaVersion ${current.schemaVersion} → ${current.schemaVersion + 1}. ` +
          `Target version: ${targetVersion}.`,
      );
    }
    current = next.migrate(current);
  }

  return current;
}

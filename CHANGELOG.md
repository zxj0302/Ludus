# Changelog

All notable changes to Ludus are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-07-10

### Added

- **高级生成器插件化**：`GamePluginEntry.generatorControls`（Lights Out / Sudoku / Nonogram 自描述）；`generator-config` 共享 PRNG/参数读取
- **套壳模拟验证**：`pnpm validate:shell`（shell 构建 + 配置/产物契约测试）；CI 集成
- **gameStore 模块化**：`gameStoreLevelGeneration` / `gameStoreSolverRuntime` / `gameStoreProgress` 职责拆分
- **按游戏难度记忆**：`difficultyRangeByGame` 替代全局难度范围
- **Sudoku seed 可复现**：`config.seed` 生成相同盘面
- **教育解析稳健化**：`educationSectionParser` + 回归测试
- **Nonogram 最优解预览**：`GamePluginEntry.ui.SolutionPreview` 插件钩子

### Fixed

- Nonogram playable state 不再泄漏 `solution` 答案
- 高级生成失败时保留当前关卡并显示 `generatorError`（不再静默 fallback）
- `setGeneratorParam` 拒绝 `NaN`；`reset`/`undo`/`redo` 清理 stale `lastGeneratedLevel`
- `prependHistory` 走 store 持久化路径
- 移除 Sudoku 高级生成无效「唯一解」开关
- `DifficultySelector` 高级生成改为独立按钮（select 仅承载难度预设）
- 生成摘要 `generatedBy` i18n 化

### Changed

- `apps/web/src/generatorControls.ts` 退化为 registry 适配层
- `shellBuildArtifacts` 在无 shell dist 时自动跳过（CI `test:run` 与 `validate:shell` 分工）

## [0.1.1] - 2026-07-09

### Fixed

- Windows desktop installer blank window: shell builds no longer pass Vite's relative asset base (`./`) to React Router as `basename`.
- Release package versions are synchronized to `0.1.1`, so future desktop bundles use the correct installer filename version.

## [0.1.0] - 2026-07-09

### Added

- **8 款可玩游戏**：Lights Out、Sokoban、Sudoku、Nim、Wythoff、15-Puzzle、倒水谜题、Nonogram
- 每款含：规则引擎、求解器、生成器（若适用）、难度度量、算法可视化、五段式教学（L2/L3 × 中/英）
- Hub 主界面：搜索、分类筛选、继续游戏、游玩统计
- 进度持久化：`localStorage` 存档、计时累计、通关计数
- 通用 `DifficultySelector` + `GeneratorToolbar`（7 款游戏接入）
- **桌面端**：Tauri 2 套壳（`pnpm dev:desktop` / `pnpm build:desktop`）
- **移动端**：Capacitor 6 配置骨架（`pnpm sync:mobile`）
- GitHub Actions CI：typecheck、386 测试、web/shell 构建

### Fixed

- 游戏页永久「加载中」：进度恢复 `isOwnState` 校验、Hub 链接 `resume` 状态
- 侧边栏布局与推箱子到位显示
- Tauri 开发壳白屏：`beforeDevCommand` 路径与 Vite `127.0.0.1:5173`

### Changed

- 架构：游戏即插件（`GamePluginEntry`），`packages/ui` 共享组件
- GitHub Pages 公开部署已关闭（个人账号不支持私有可见性）

### Known limitations (v0.1.0)

- Sokoban 生成器为 Microban 选关，非程序化生成
- 4×4 / 5×5 Lights Out 在 `requireUnique` 时无法保证唯一解
- 移动端仅配置就绪，未做设备端验证

[0.2.0]: https://github.com/zxj0302/Ludus/releases/tag/v0.2.0
[0.1.1]: https://github.com/zxj0302/Ludus/releases/tag/v0.1.1
[0.1.0]: https://github.com/zxj0302/Ludus/releases/tag/v0.1.0

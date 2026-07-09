# Changelog

All notable changes to Ludus are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-07-09

### Added

- **8 款可玩游戏**：Lights Out、Sokoban、Sudoku、Nim、Wythoff、15-Puzzle、倒水谜题、Nonogram
- 每款含：规则引擎、求解器、生成器（若适用）、难度度量、算法可视化、五段式教学（L2/L3 × 中/英）
- Hub 主界面：搜索、分类筛选、继续游戏、游玩统计
- 进度持久化：`localStorage` 存档、计时累计、通关计数
- 通用 `DifficultySelector` + `GeneratorToolbar`（7 款游戏接入）
- **桌面端**：Tauri 2 套壳（`pnpm dev:desktop` / `pnpm build:desktop`）
- **移动端**：Capacitor 6 配置骨架（`pnpm sync:mobile`）
- GitHub Actions CI：typecheck、384 测试、web/shell/pages 构建

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

[0.1.0]: https://github.com/zxj0302/Ludus/releases/tag/v0.1.0

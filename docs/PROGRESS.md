# PROGRESS.md — Ludus 项目进度（唯一真相源）

> 本文件让任何一个全新的 Claude 实例仅凭它即可接续工作。
> 每次完成工件后按 CLAUDE.md A.3 更新本文件。

## 📍 CURRENT STATE

- **当前阶段**：**阶段 7 — v0.2.0 审计硬化版发布后增量**；Hub 上线 9 款游戏（含孔明棋）。围堵小偷模块已自代码库移除。
- **MVP 范围**：9 款上线游戏（Lights Out ✅ + Sokoban ✅ + Sudoku ✅ + Nim ✅ + Wythoff ✅ + 15-Puzzle ✅ + 倒水谜题 ✅ + Nonogram ✅ + 孔明棋 ✅）。
- **Backlog**：162 款游戏，覆盖 16 个原理领域 × 4 个参考平台。
- **代码库状态**：4 包 monorepo + apps/web/desktop/mobile，481 个测试（全过），CI 就绪（含 `validate:shell`），Release workflow 就绪。
- **Core**：10 文件（types/plugin + schemas + worker），零游戏专属代码。SolverTrace type 新增 `'a-star-search'` + `'bfs-state-search'`。
- **测试覆盖**：57 个测试文件，481 测试全过。
- **架构重构**：10 步全部完成。每游戏自包含（types/rules/solver/generator/difficulty/render/manifest/i18n）。GamePluginEntry 完整自描述（i18n/education/viz 已填充，不再空对象）。新增游戏 = 加目录 + registry 一行 + entrySetup.tsx 一个区块。
- **审计修复第一批**：Sudoku 高级生成移除无效唯一解开关；高级数字参数拒绝 `NaN`；`lastGeneratedLevel` 在 reset/undo/redo 后清理；`prependHistory` 收回 store action 并走持久化路径。
- **审计修复第二批**：Nonogram playable state 不再携带 `solution`；`isOwnState`/Canvas 渲染改为基于线索判定通关；高级生成失败时保留当前关卡并显示 `generatorError`，普通 toolbar 生成仍允许 fallback。
- **架构债收敛（高级生成 metadata）**：`GeneratorControlsSpec` 迁入 `GamePluginEntry.generatorControls`（Lights Out / Sudoku / Nonogram 自描述）；`apps/web/src/generatorControls.ts` 退化为 registry 适配层。
- **审计修复第三批**：`difficultyRange` 改为按游戏分区（`difficultyRangeByGame`）；生成摘要 `generatedBy` i18n 化；Nonogram 最优解预览迁入 `GamePluginEntry.ui.SolutionPreview`，`EducationPanel` 去除 `gameId === 'nonogram'` 硬编码。
- **移动端模拟验证**：新增 `pnpm validate:shell`（`build:shell` + 产物/配置契约测试）；`shellBuildArtifacts.test.ts` 校验相对资源路径与 `solver.worker`；真机验证暂缓。
- **审计修复第四批（低优先级）**：`DifficultySelector` 高级生成改为独立按钮；`splitEducationSections` 抽出并加回归测试；`gameStoreLevelGeneration.ts` 承接关卡生成；`generator-config.ts` 统一 PRNG/参数读取。
- **审计修复第五批**：`gameStoreSolverRuntime.ts` 承接 AI/后台求解/对抗播放/提示逻辑；Sudoku 生成器全链路接入 `config.seed` 可复现。
- **审计收尾**：`gameStoreProgress.ts` 外置进度持久化；CI 用 `pnpm validate:shell` 替代手工 grep；`shellBuildArtifacts` 在无 shell dist 时自动跳过。
## ✅ DONE

- 录入项目宪法与会话协议：`CLAUDE.md`
- 录入决策记录：`docs/DECISIONS.md`（ADR-001~022，005 未采用）
- 录入长期游戏清单：`docs/phases/00-backlog.md`
- **阶段 0**：`docs/phases/00-alignment.md` ✅
- **阶段 1**：`docs/phases/01-product-plan.md` ✅
- **阶段 2**：`docs/phases/02-architecture.md` ✅

  - 四层架构 + 9 包 monorepo + GamePlugin v1.0 + 3 zod schema + migrator + 平台矩阵
  - 15 个代码文件：根配置 + Core 层类型/schema
- **阶段 3**：`docs/phases/03-education-framework.md` ✅

  - 五段式模板 + 创作指南 + **Lights Out 完整教学内容 (L2/L3 × zh-CN/en，4 个 .md 文件)**
  - 教学内容加载方案（Vite ?raw import → entrySetup.tsx → entry.education.content）
  - **§5 已按四种保证机制重写**（可解性/唯一解/最优解/难度可控 + 策略对比表）
  - **Markdown 格式修复**：全 11 个 .md 文件扫描，修复嵌套代码块高亮冲突、LaTeX 转义、占位符、裸 `<`、中文引号等 8 处问题
- 围堵小偷 v1.1 final-review Important 修复：`packages/games/src/thief-siege/` + `.superpowers/sdd-v11/final-fix-report.md`，覆盖 open-map 生成、同步 BFS AI、AI tier UI。
- **UI 设计系统**：`docs/phases/04-ui-design-system.md` ✅

  - "Playful Bento"设计哲学与 Bento Box 适配论证
  - 完整 Design Tokens（颜色 Warm Stone/Logic Indigo/Game Amber/Clarity Teal、字体 Inter+JetBrains Mono、间距 4px 基准、分层圆角 6–24px、阴影/玻璃）
  - 布局系统：6 列 Bento 网格 + 8 种卡片预设 + Hub/GameShell/Education 三套页面模板
  - 组件架构：15 个 `packages/ui` 组件规格 + 4 个 `packages/viz` 组件
  - 动效规范：Framer Motion 变体 + 时长阶梯 + prefers-reduced-motion
  - 响应式策略：4 断点 × 7 层适配 + 移动端特殊处理
  - 可访问性：色盲/键盘/屏幕阅读器/WCAG AA 对比度
  - Tailwind 配置扩展 + CSS 变量 tokens + 实施顺序
- ADR-018 (Playful Bento UI 设计系统) 录入 `docs/DECISIONS.md` ✅
- **阶段 4 前置决策** ✅：

  - ADR-019 状态管理：Zustand（~2KB，零 boilerplate，Core 层保持纯 TS）
  - ADR-020 路由：React Router v6（`/` Hub + `/game/:gameId`）
  - ADR-021 音效：Howler.js + 阶段 4 即做基础音效（<20KB audio sprite）
  - ADR-022 启动边界：仅开发 `packages/core` + `packages/games` + `apps/web` 三个包
- **竞品分析与 Backlog 扩充** ✅：

  - 竞品调研 8 平台（Brilliant/CodinGame/Zachtronics/VisuAlgo/Euclidea/AlgoQuest/Sokoban/AlgoViz）
  - 4 参考平台游戏清单集成（Simon Tatham 40 / GamesCrafters 62+11 / cut-the-knot / Red Blob Games）
  - `docs/phases/00-backlog.md`：74 → 162 款（+88 款），16 个领域全覆盖
  - 新增"优先采用权威实现"政策 + 🔗 权威/参考实现索引
- **四轮全项目审计** ✅：全 8 个阶段/决策文件逐行审查，修复 36 处一致性与准确性问题
- **阶段 5a — Sokoban 推箱子原型** ✅：

  - Core: Sokoban 状态类型 + 规则引擎（rules/legalMoves/applyMove/isSolved/deadlock）+ BFS 求解器（状态去重 + 死锁剪枝 + search-tree trace）
  - Core: Microban 经典关卡集 15 关（David W. Skinner，公域）+ 解析器 + 生成器（按难度范围选关）
  - Game: 完整插件（rules/manifest/index）+ SokobanBoard 渲染（DOM+CSS Grid，墙壁/箱子/目标/玩家四层渲染，Framer Motion layout 动画，键盘+滑动操控）
  - Web: GameShell 动态 Board 选择 + EducationPanel 游戏泛化（支持 search-tree trace + Sokoban 状态卡片）
  - Web: BFSTreeViz（custom SVG 懒加载，BFS 搜索树交互式逐层展开 + 最优路径标记 + 死锁/已解状态高亮）
  - i18n: 中英翻译 key（Sokoban 名称/描述/搜索树/移动方向/状态卡片）
  - 教学: 四份 markdown（L2/L3 × zh/en），五段式结构
  - 测试: Sokoban 规则+求解器 16 测 + 生成器 7 测 + 难度 3 测 = **26 新测试，69 全过**
  - 构建: v1.0 成功，React Flow 懒加载分包（+178KB gzip 58KB）
  - 新增 17 个文件，修改 10 个文件
- **阶段 5b — 数独 (Sudoku)** ✅:
  - Core: DLX 精确覆盖求解器 (solveSudoku/countSudokuSolutions/validateSudoku) + 线索数难度公式 (17-36 clues → 0-100) + dig-with-DLX 生成器
  - Game: 完整插件 (rules/manifest/index/render) + SudokuBoard 渲染 (CSS Grid 9×9 + 数字面板 + 冲突高亮)
  - Web: GameShell 动态 Board 选择 + EducationPanel 状态卡片 + DLXMatrixViz 懒加载
  - i18n: 中英翻译 key (Sudoku 名称/描述/面板/矩阵)
  - 教学: 四份 markdown (L2/L3 × zh/en)，五段式结构
  - 测试: DLX 求解器 16 测 + 生成器 5 测 + 规则 14 测 + 难度 4 测 = 39 新测试
- **阶段 5c — Nim (Nim-sum / Bouton 1901)** ✅:
  - Core: Nim 状态类型 + computeNimSum / findWinningMove / solveNim (O(n) XOR) + isPPosition + P-distance walk 生成器 + 难度公式
  - Core: Nim-solver 15 测 + Nim-generator 6 测 (P-distance/P-position/N-position 全覆盖) + Nim-difficulty 5 测
  - Game: 完整插件 (rules/manifest/index/render) + NimBoard 渲染 (DOM + Framer Motion, 石子动画 + 移除数量选择器 + 提示高亮)
  - Web: GameShell 动态 Board 选择 (niState 分支) + EducationPanel 状态卡片 (Piles/Nim-sum) + NimTreeViz 懒加载 (React Flow + Dagre)
  - AI: 游戏 Store 内建 AI 自动对弈 (setTimeout 600ms + findWinningMove + P-position fallback)，两步区分玩家/AI
  - i18n: 中英翻译 key (nim.* 完整覆盖)
  - 教学: 四份 markdown (L2/L3 × zh/en)，五段式结构
  - 测试: Nim 规则 16 测 + 求解器 15 测 + 生成器 6 测 + 难度 5 测 = 42 新测试, **152 全过**
  - 构建: v1.0 成功, NimTreeViz 懒加载分包 (~268KB gzip ~90KB)
  - 新增 ~11 个文件, 修改 8 个文件 (规则改为双人对弈, 支持 AI 通过 applyMove 走子)
- **阶段 5d — Wythoff (Beatty 序列 / Wythoff 1907)** ✅:
  - Core: Wythoff 状态类型 + isWythoffPPosition (O(1) 黄金比例判定) + findWythoffWinningMove (O(maxPile) 枚举) + solveWythoff + 随机生成器 + 难度公式
  - Core: Wythoff-solver 16 测 + Wythoff-generator 5 测 + Wythoff-difficulty 6 测
  - Game: 完整插件 (rules/manifest/index/render) + WythoffBoard 渲染 (两堆石子 + "同时取两堆"按钮列 + 选择先后手机制)
  - Web: GameShell 动态 Board 选择 (wyState 分支) + EducationPanel 状态卡片 (Beatty 对/黄金比例) + WythoffTreeViz 懒加载 (React Flow + Dagre)
  - AI: scheduleWythoffAI 内建 (复用 Nim 的 4 层防护 + 600ms 延迟模式)
  - 架构：store 中 Nim/Wythoff 共享 `isAdversarial` 分支，最优步数/通关文案对两款对战游戏统一隐藏
  - i18n: 中英翻译 key (wythoff.* 完整覆盖, 27 keys × 2 languages)
  - 教学: 四份 markdown (L2/L3 × zh/en)，五段式结构，含 Beatty 定理推导与 Nim 对比表
  - 测试: Wythoff 规则 20 测 + 求解器 16 测 + 生成器 5 测 + 难度 6 测 = 47 新测试, **199 全过**
  - 构建: v1.0 成功, WythoffTreeViz 懒加载分包 (~3.3KB gzip ~1.6KB)
  - 新增 16 个文件, 修改 13 个文件
- **架构重构：游戏即插件（ADR-023）** ✅：
  - 10 步全部完成：GamePluginEntry 接口 + GamePlugin.ai 字段 + 26 文件从 core 迁回各游戏 + gameStore 去游戏化（590→455 行）+ packages/ui 填充（5 个共享组件）+ GameShell 去游戏化（418→260 行）+ Core barrel 清理 + i18n 拆分 + EducationPanel 解耦
  - 最终包结构：4 包（core/games/education/ui）+ apps/web。i18n/viz 包已移除。
  - 每游戏自包含（types/rules/solver/generator/difficulty/render/manifest/i18n）。新增游戏 = 加目录 + registry 一行。
  - 196 测试全过，typecheck 零错误，vite build 成功
- **阶段 5e — 15-Puzzle (A* 搜索)** ✅:
  - Core: FifteenState/FifteenMove 类型 + 规则引擎（legalMoves/applyMove/isSolved）+ A* 求解器（曼哈顿距离启发式 + MinHeap 优先队列 + 状态去重）+ 随机走动生成器（保可解）+ 难度公式（scrambleDepth/80）
  - Game: 完整插件（rules/manifest/index/render）+ FifteenBoard 渲染（CSS Grid 4×4 + Framer Motion layout 动画 + 键盘方向键 + 点击双交互）
  - Web: GameShell 动态 Board 选择 + EducationPanel 状态卡片 + FifteenTreeViz 懒加载（custom SVG，路径节点缩略图 + f/g/h 标注 + f 值趋势图）
  - i18n: 中英翻译 key（fifteen.* 完整覆盖，17 keys × 2 languages）
  - 教学: 四份 markdown（L2/L3 × zh/en），五段式结构
  - 测试: 规则 9 测 + 求解器 8 测 + 生成器 6 测 + 难度 6 测 = 29 新测试，**225 全过**
  - 构建: v1.0 成功，FifteenTreeViz 懒加载分包（~3.3KB gzip ~1.3KB）
  - 新增 13 个文件（9 core + 4 edu），修改 5 个文件（registry/zh-CN/en/entrySetup/worker）
  - isFastSolver: false（A* 走后台 scheduleBackgroundSolve，不阻塞 UI）
  - SolverTrace type 新增 `'a-star-search'`（packages/core/src/types/plugin.ts）
- **阶段 5f — 倒水谜题 (Water Jug Problem)** ✅:
  - Core: WaterJugState/WaterJugMove 类型 + 规则引擎（legalMoves/applyMove/isSolved）+ BFS 求解器（状态去重 + 最短路径保证）+ 随机生成器（裴蜀定理保证可解）+ 难度公式（最优深度归一化）
  - Game: 完整插件（rules/manifest/index/render）+ WaterJugBoard 渲染（CSS 水壶动画 + 装满/倒空/倒水三操作 + pour 两步选择）
  - Web: GameShell 动态 Board 选择 + EducationPanel 状态卡片（状态空间/GCD）+ WaterJugTreeViz（custom SVG，BFS 路径节点水壶缩略图 + → 箭头）
  - i18n: 中英翻译 key（waterJug.* 完整覆盖，26 keys × 2 languages）
  - 教学: 四份 markdown（L2/L3 × zh/en），五段式结构，含裴蜀定理推导 + BFS 伪代码 + 求解器对比表
  - 测试: 规则 30 测 + 求解器 11 测 + 生成器 8 测 + 难度 6 测 = 55 新测试，**281 全过**
  - 构建: v1.0 成功，WaterJugTreeViz 懒加载分包
  - 新增 13 文件（9 core + 4 edu），修改 7 文件（core types/registry/barrel/entrySetup/statusCards/EducationPanel/i18n 自动合并）
  - isFastSolver: true（BFS 状态空间小，即时求解）
  - SolverTrace type 新增 `'bfs-state-search'`（packages/core/src/types/plugin.ts）
- **阶段 5h — 围堵小偷 (Thief Siege)** ✅:
  - Core/Game: types + rules + escape BFS solver/AI + irregular-mask generator + difficulty + plugin/board UI 全部自包含于 `packages/games/src/thief-siege/`
  - Web: `entrySetup.tsx` 注入四份教学 raw markdown，注册 `EscapePathViz` 处理 `escape-path` trace，并接入 `GeneratorToolbar`
  - 教学: 四份 markdown（L2/L3 × zh-CN/en），五段式结构，明确 BFS/瓶颈直觉且不声称完整 minimax
  - 文档: `docs/games/thief-siege.md` 记录规则、模块地图、solver/generator/AI wiring 与扩展边界
  - 验证: 55 个测试文件 / 466 测试全过，`pnpm typecheck` 成功
- **围堵小偷 v1.1** ✅:
  - 地图尺寸按难度升级为 11 / 15 / 19；简单关通过 `copHasWinningStrategy` 严格验证，中/难关采用瓶颈构造 + 浅层对抗抽检。
  - 小偷 AI 接入 `adversary.ts` 有限预算 minimax/alpha-beta，Web 通过 `ai-move` Worker 路径运行，超时/不可用时降级到 BFS 贪心。
  - 教学与文档更新：四份 `packages/education/src/content/thief-siege/*.md`、`docs/games/thief-siege.md`、`docs/DECISIONS.md` ADR-024。
  - 验证：57 个测试文件 / 481 测试全过，`pnpm typecheck` 成功。
- **孔明棋 Task 3 — puzzles / generator / difficulty** ✅:
  - `packages/games/src/peg-solitaire/puzzles.ts`：经典英式中心空盘 + 4 个精选微型/中型残局。
  - `packages/games/src/peg-solitaire/generator.ts`：按难度映射 `le3` / `one-any` / `one-center`，使用 seeded curated candidates + 轻量 dig-out + solver 验证。
  - `packages/games/src/peg-solitaire/difficulty.ts`：基于 peg count、mobility、goal strictness、center occupancy 的 0–100 难度评分。
  - 验证：Peg Solitaire 4 个测试文件 / 19 测试全过，`pnpm typecheck` 成功。
- **孔明棋 Task 4 — playable plugin / Hub registry / Worker** ✅:
  - `packages/games/src/peg-solitaire/` 新增 `render.tsx`、`manifest.ts`、`i18n.ts`、`education-ui.tsx`、`index.tsx`；实现英式十字盘可玩 UI、plugin metadata、状态卡与走子格式化。
  - `packages/games/src/registry.ts` / `packages/games/src/index.ts` 注册并导出 `peg-solitaire`；`apps/web/src/entrySetup.tsx` 注入空 education content（Task 5 填充）。
  - `apps/web/src/workers/solver.worker.ts` 通过 `@ludus/games/src/peg-solitaire/solver` 直接导入 `solvePegSolitaire`，避免 Worker 触碰 barrel。
  - 验证：Peg Solitaire + load-smoke 39 测全过，`pnpm typecheck` 成功，`pnpm --filter ludus-web build` 成功。
- **孔明棋 Task 5 — rich education / PegSearchViz / docs** ✅:
  - `packages/education/src/content/peg-solitaire/` 新增 L2/L3 × zh-CN/en 四份重教学内容，显式包含 hooks 与 rigorous claims，覆盖 bitmask、D4、BFS/DFS、Worker、生成验证与 Lights Out 对比。
  - `apps/web/src/components/PegSearchViz.tsx` + `apps/web/src/entrySetup.tsx` 接入 `search-tree` 证据面板、raw markdown 与 `GeneratorToolbar`。
  - `docs/games/peg-solitaire.md` 与 `docs/DECISIONS.md` ADR-025 记录 search-tree 复用和可视化边界。
  - 验证：`pnpm test:run` 503 测全过（3 skipped）；`pnpm typecheck` 成功。
- **孔明棋 bugfix 批次** ✅:
  - 删除无解精选关 `middle-band-one-any`；扩充为 10 个已验证残局（含 5–6 步中/难）。
  - 生成器禁止未验证 fallback；非法走子不再改写 state 引用；终局 `stuck/won` 禁用棋盘并提示。
  - 选子状态随 undo/新关重置；默认开局改为经典中心空（`one-center`）。
  - 验证：Peg Solitaire 5 文件 / 21 测全过。
- **孔明棋难度/新关卡修复** ✅:
  - 难度分按 goal 对齐 Hub 易/中/难档；「随机」跨三档抽 goal。
  - 生成器改为逆向合成 + 验证，刷新不再卡在 2 个微型残局；每次生成附带新 seed。
  - `GeneratorToolbar` 切档时显式传入 `difficultyRange`，避免与 store 写入竞态。
  - 验证：Peg 25 测 + web generator/store 相关测全过。
- **孔明棋 spec 纠偏** ✅:
  - 生成器回到 §5.2：经典主入口 + 精选残局 + 从经典挖空并验证；Hub 默认 hard `[67,100]`。
  - `PegSearchViz` 改为 React Flow 主变例树；`manifest.library = 'react-flow'`；ADR-025 / `docs/games/peg-solitaire.md` 同步。
  - 难度分恢复 §5.3 综合（目标严格度 + 子数负载 + 机动性）。
  - 验证：Peg 25 测全过。
- **孔明棋 v1.1 合集选关** ✅:
  - 按确认 spec：移除 `le3` 与挖空生成；`PEG_CATALOG` 经典名局；取消程序化造关。
  - 教学四份 md 强调 `one-any` vs `one-center`；ADR-026。
- **孔明棋 v1.2 模式+选关** ✅:
  - 取消难度选择；`PegSolitaireToolbar` 对齐推箱子（模式「剩一 / 中心剩一」+ 名局）。
  - `generateLevel` 降为 Hub 回退；教学/spec/ADR/开发者文档同步；Peg 22 测全过。
- **孔明棋合集扩充** ✅:
  - 录入希腊十字/金字塔/箭头/菱形/房屋/大菱形等教科书名局；中心模式增加中心星、南端空、D4 归心变体。
  - 说明：模式按 goal 过滤，同一盘面未必两边都可解。

- **孔明棋审查修复（P0–P2）** ✅:
  - Hub `seed: 0` → 经典；`loadGame`/`newLevel` 读 `level.optimalSteps`；Worker 超时不进 playback。
  - `isSolved` 以 goal 为准；后台求解保留合集最优 + 挂 timeout trace（供实时分析）；`generator: degraded` + ADR-025 勘误。
  - `Collection` 抽到 `types/levelCollection`；LevelSelector `shortLabel`；orphan i18n / 死导出清理。
  - 二次审查：resume 恢复 optimalSteps；超时不误标剩余步/不播错误音；viz 超时 Length 显示 —。

- **阶段 4 垂直切片 — Lights Out 端到端样板** ✅：

  - **Core 层**：GF(2) 高斯消元求解器 (`solveGF2`/`optimalSolution`/`buildLightsOutMatrix`) + 反向求解生成器 (`generateLightsOutLevel`) + Worker 消息协议 (`shouldUseWorker`)
  - **Game 层**：Lights Out 完整插件（rules/solver/generator/manifest/render/plugin） + 游戏注册表
  - **Web 层**：`apps/web/` 全栈骨架（Vite + React 18 + Tailwind + Framer Motion + React Router v6 + Zustand + react-i18next + Howler.js）
  - **UI 组件**（9 个）：HubPage / GamePage / GameShell / GameToolbar / GameStatusBar / ProgressiveDisclosure / KnowledgeCard / EducationPanel / MatrixViz
  - **Web Worker**：`solver.worker.ts` + Vite `?worker` 动态加载 + store 条件分流（大状态走 Worker）
  - **i18n**：中/英双语言完整覆盖，language switcher 可用
  - **单元测试**：38 测试全过（gf2.test.ts 16 / rules.test.ts 17 / generator.test.ts 5）
  - **验证通过**：(a) 三层体验同实例切换 (b) `vite build` 成功 (c) 中英双语覆盖 (d) Worker 基础设施就绪
  - **构建产物**：dist ~568KB (gzip ~160KB)，React/Motion/Router/Worker 分包

## 🚧 IN PROGRESS

- 无。Peg Solitaire viz/记号/公式修复已落地。

## 🔖 NEXT ACTION（下一次会话第一步）

手动冒烟 Hub `peg-solitaire`：首进经典+最优31；实时分析有树；resume 保留最优；超时无错误音/无空回放。确认后可 merge / PR。

Spec：`docs/superpowers/specs/2026-07-14-peg-solitaire-catalog-design.md`

## 🐛 KNOWN ISSUES

- 4×4 和 5×5 Lights Out 矩阵不可逆（nullity 4/2），唯一解不可能——高级生成器 UI 已说明并在生成逻辑中降级为可解关卡
- Sokoban 生成器为 Microban 选关（v0.1），尚未实现高质量程序化生成
- `GamePluginEntry.education.content` 仍由 `entrySetup.tsx` 注入（Vite `?raw` 限制，架构上可接受）
- 本机移动端真机运行环境未完成（**暂缓**）：`pnpm validate:shell` 模拟验证通过；`cap run android` 仍依赖 Android SDK，待后续配置
- **围堵小偷**已从 Hub 取消注册：玩法/生成/AI 体验未达标；源码与测试保留

## 📌 OPEN QUESTIONS / 待我确认

- 移动端真机验证暂缓；日常 `pnpm validate:shell`。

## 📝 SESSION LOG

- [初始化] 创建 docs 骨架，写入 CLAUDE.md / DECISIONS.md / 00-backlog.md / PROGRESS.md。
- [2026-06-25] 阶段 0 完成；用户确认全部默认建议 → ADR-006~008, 013~017 转 ACCEPTED。
- [2026-06-25] 阶段 1 完成（三层画像 + 故事地图 + MoSCoW + 路线图 + MVP 边界）；用户确认。
- [2026-06-25] 阶段 2 完成（四层架构 + 9 包 monorepo + GamePlugin v1.0 + 3 zod schema + migrator + 平台矩阵）；已创建 `packages/core/src/` 完整类型与 schema 源码。
- [2026-06-25] 阶段 3 完成（五段式模板 + 创作指南 + Lights Out 4 份教学内容 L2/L3 × zh/en + ContentRenderer 接口骨架）；已强化 §5 按四种保证机制重写；Markdown 格式修复 8 处。
- [2026-06-25] 阶段 3 确认完成 + 历史修订：去掉微信小程序降级痕迹。
- [2026-06-26] UI 设计系统：`docs/phases/04-ui-design-system.md` — Playful Bento 完整设计系统。ADR-018 录入。
- [2026-06-26] 阶段 4 前置决策：ADR-019~022 → ACCEPTED。NEXT ACTION 扩展到 22 步。
- [2026-06-26] 四轮全项目审计与修复：合计修复 36 处问题。
- [2026-06-26] 竞品分析与 Backlog 扩充：74 → 162 款（+88），4 参考平台全覆盖。
- [2026-06-26] **阶段 4 垂直切片完整实现**：
  - Core: GF(2) 求解器 + 反向生成器 + Worker 协议
  - Game: Lights Out 完整插件（7 文件）+ 注册表
  - Web: `apps/web/` 全栈骨架 + 11 个 UI 组件 + Worker 集成
  - 测试: 39 测试全过，typecheck 全绿，vite build 成功
  - 46 个源文件，dist ~568KB (gzip ~160KB)
  - 阶段 4 完成，项目进入有可运行代码的新阶段
  - [2026-06-26] i18n 全面修复：新增 ~30 个翻译 key，修复 7 个组件中硬编码中/英文字符串（GameShell/GameStatusBar/GamePage/MatrixViz/EducationPanel/App/HubPage），MatrixViz 统计视图/消元步骤/图例/状态等全部改用 t()，HubPage 描述改用 game.metadata.descriptionKey 泛化。38 测试全过，typecheck 通过。
  - [2026-06-26] Lights Out 第二轮审计与 8 项修复：
    1. rules.test.ts:134 描述"invertible matrix"→"by construction"（5×5 不可逆）
    2. solver.worker.ts 硬编码中文描述 → 技术英文
    3. uniqueSolution 字段 → unique（修复语义：降级后不虚假报告 true）
    4. Worker timeMs: 0 → performance.now() 实测
    5. getDifficulty (rules.ts) 亮灯比例公式 → 基于求解的公式（与 generator 一致）
    6. category: '线性代数' → i18n key 'category.linear-algebra' + 中英翻译
    7. Hub 卡片 💡 硬编码 → game.metadata.icon 字段（可选）
    8. l3.zh-CN.md 伪代码 "Eliminate below" → "消除所有其他行（RREF）"
    9. 额外修复：PROGRESS.md 清理重复的 KNOWN ISSUES/OPEN QUESTIONS/SESSION LOG 节
       39 测试全过，typecheck 通过。
  - [2026-06-26] 侧边栏动画性能优化：去除 CSS `transition-all` on width（触发布局重算），改用 Framer Motion `translateX` + `opacity`（GPU 合成）；EducationPanel 首次打开后保持挂载（避免动画中 mount/unmount）；移动端使用全屏 overlay + translateX 滑入。
  - [2026-06-26] 编写 `docs/lessons-learned.md`：从 Lights Out 开发中总结 9 大类经验（架构/i18n/性能/常见 Bug/测试/Worker/难度系统/开发流程/新游戏检查清单），供后续游戏开发参考。
- [2026-06-26] **阶段 5a — Sokoban 推箱子原型**：
  - 从立项到端到端打通：Core 规则引擎 + BFS 求解器 + 死锁检测 + Microban 15 关 + Game 层完整插件 + SokobanBoard 渲染（DOM 四层 + Framer Motion layout 动画 + 键盘/触屏支持）
  - 架构演进：GameShell 动态 Board 选择（按 gameId 分支）+ EducationPanel 游戏泛化（支持 matrix-transform / search-tree 两种 trace）
  - 新增 BFSTreeViz（custom SVG 懒加载）；@xyflow/react 依赖保留供未来图类可视化使用
  - i18n 新增 20+ key，教学 4 份 markdown（L2/L3 × zh/en）
  - 65 测试全过，typecheck 全绿，vite build 成功（~1042KB，gzip ~330KB）
  - 生成器为 Microban 选关（v0.1），高质量生成器（反向行走/模板/进化）待后续实现
- [2026-06-26] **Sokoban 全面审查与 5 项修复**：
  1. L3 教育文档事实错误：Microban 关卡数 40 → 155，难度公式对齐实际代码
  2. gameStore solveError 硬编码英文 → i18n key `game.status.timedOut`
  3. stopPlayback N 次 undo 逐个重渲染 → 单次 set() 历史切片
  4. 删除未使用的 `sokobanSoundManifest`
  5. `generateSokobanLevel` 现在按 `difficultyRange` 筛选关卡
  6. 测试 65/65 全过，typecheck + vite build 通过
- [2026-06-26] **Sokoban 第二轮审查 + 15 修复 + 侧边栏终局方案 + 经验沉淀**：
  1. BFS `shift()` O(n²) → 索引出队 O(1)
  2. `visualizationManifest` 信息过时 → `BFSTreeViz` + `custom-svg`
  3. `generateSokobanLevel` 同步 BFS 阻塞 UI → 移除 BFS 调用
  4. `getDifficulty` 在 rules.ts 和 generator.ts 重复 → 提取 `computeSokobanDifficulty` 到 core 层
  5. `generatePlayableState` fallback 随机游走对 Sokoban 无意义 → 简化为 `plugin.initialState()`
  6. 超时检测 `>= 9000` vs BFS `8000ms` → 统一为 `>= 7000`
  7. `maxFrontier` 死代码 → 移除
  8. 双重 solver 包装 → 直接 re-export
  9. `useSokobanLevels` 内建关卡重复 → 从 core `getLevel()` 导入
  10. 关卡 ASCII 格式注释缺 `+` 符号 → 补全
  11. L3 死锁伪代码与实际实现不符 → 修正为 `isWall` only
  12. L3 "Microban 40 关" → 澄清 web 层加载外部关卡
  13. Level 1 来源错误标注 → 移除 "Thinking Rabbit original #1"
  14. `setDisclosureLevel` 对 Sokoban 同步 BFS → 保留旧解
  15. `requestHint` 同步 BFS → `setTimeout` + `solverStatus: 'running'`
  16. **侧边栏布局终极方案**：flex `items-start` + ResizeObserver 测量左列高度 + 右列 `height` 同步（非 `min-height`），同时解决顶部和底部对齐
  17. "最优解"卡片关卡切换不消失：`loadCustomState` 对 Sokoban 保留 `prevSol`，500ms 延迟后台 BFS
  18. 后台 BFS 不卡 UI：延迟从 100ms → 500ms + state 引用检查防 stale
  19. LevelSelector popover 误关闭：backdrop div → document `mousedown` + `ref.contains()`
  20. 测试 65/65 全过，typecheck + vite build 通过
- [2026-06-26] **阶段 5b — 数独完整实现（DLX + 生成器 + 渲染 + 教学 + 39 测试）**
- [2026-06-26] **Sokoban 第三轮审查 + 修复**：
  1. `bfs-sokoban.ts` 队列耗尽 case 缺 `trace` → 三路返回都带 trace
  2. `SolutionStats` 加 `terminated: 'solved'|'timeout'|'exhausted'` 显式信号，替换 `timeMs >= 7000` 启发式（store + BFSTreeViz 同步更新）
  3. `buildTrace` `maxDepth` 从 step 反推不可靠 → 独立变量追踪，首层 trace 必入
  4. `LevelSelector` 硬编码 'Select'/合集/关卡 → i18n 化（新增 3 key × 2 语言）
  5. 删除孤儿 `SearchTreeViz.tsx`（无任何组件 import）
  6. 删除死 i18n key：`searchTree.*` (5 个) + `bfsTree.reset/expandedCount/optimalSteps/nodesExplored/optimalHint` (5 个)
  7. `useSokobanLevels` 硬编码 `[getLevel(0), getLevel(1), getLevel(2)]` → `getAllLevels()`
  8. 删除 core 层未使用的 `addExternalLevels`/`clearExternalLevels`/`_externalCache`（死 API）
  9. `manifest.ts` `complexityClass` 风格统一（加描述性补充）
  10. L3 文档加死锁实现限制说明 + Worker 分流"未实现"标注
  11. L3 Microban 关卡数 155 → 150+（与实际文件一致）
  12. `sokoban-generator.test.ts` 测试描述 "5 levels" → "3 builtin levels"
  13. PROGRESS.md 测试数 65 → 69；移除 SearchTreeViz 已交付描述；合并重复 Worker KNOWN ISSUES
  14. `sokoban-levels.ts` 注释"只在整个块之外"误导 → 改为"XSB 格式以 ; 开头"
- [2026-06-26] **阶段 5c — Nim 完整实现**：
  - Core 层：Nim 状态类型 + XOR 求解器 (computeNimSum/findWinningMove/solveNim) + isPPosition + P-distance walk 生成器 + 难度公式
  - Game 层：完整插件 + NimBoard 渲染 (DOM + Framer Motion, 石子动画 + 移除选择器 + 提示高亮)
  - Web 层：GameShell 集成 (niState 分支) + EducationPanel 状态卡片 + NimTreeViz 懒加载 (React Flow + Dagre)
  - AI 自动对弈：Store applyMove 内建 setTimeout + findWinningMove + P-position fallback, 600ms 延迟, 两步区分玩家/AI
  - Nim 规则改为支持双人对弈 (applyMove 移除 currentPlayer 检查, toggle 双方走子), legalMoves 移除 player 过滤
  - i18n: nim.* 中英完整覆盖; 教学: L2/L3 × zh/en 四份
  - 测试: 152 全过 (原有 108 + Nim 42 新增), typecheck 全绿, vite build 成功
  - NimTreeViz 懒加载分包 ~268KB (gzip ~90KB)
- [2026-06-26] Nim 集成修复 — i18n 硬编码 / CONTENT_MAPS / AI 胜利检测：
  1. `EducationPanel.tsx` 中 Nim 状态卡片的"Piles"/"Nim-sum"硬编码 → `t('nim.piles')`/`t('nim.nimSum')`
  2. `CONTENT_MAPS` 缺少 nim 条目 → 添加 4 个 markdown 导入 + nim 注册
  3. `rules.ts` `isSolved` 仅检测 `currentPlayer === 1` 导致 AI 取最后一颗石不被视为终结 → 改为仅检测所有堆为空
  4. 新增 i18n key: `nim.piles` (zh-CN: "堆数", en: "Piles")
  5. 测试 152/152 全过，typecheck 全绿
- [2026-06-27] **阶段 5d — Wythoff 完整实现**：
  - Core 层：WythoffState/WythoffMove 类型 + isWythoffPPosition (O(1) 黄金比例判定) + findWythoffWinningMove (枚举单堆/双堆走法) + solveWythoff + 随机生成器（easy/medium/hard 预设）+ 难度公式 (maxStone/15)
  - Game 层：完整插件 (rules 20 测/manifest/index/render) + WythoffBoard (两堆石子 + "同时取两堆"按钮列)
  - Web 层：WythoffTreeViz (React Flow + Dagre) 懒加载 + store scheduleWythoffAI + GameShell/EducationPanel/GameStatusBar 集成
  - 架构：store 中 Nim/Wythoff 统一 `isAdversarial` 分支 + SolverTrace 类型新增 'wythoff-beatty'
  - i18n：wythoff.* 27 keys × 2 语言
  - 教学：L2/L3 × zh/en 四份 markdown (Beatty 定理推导 + Nim 对比表)
  - 测试：47 新测试 (求解器 16 + 规则 20 + 生成器 5 + 难度 6)，总计 199 全过
  - 构建：WythoffTreeViz 懒加载 ~3.3KB (gzip ~1.6KB)
  - 新增 16 文件，修改 13 文件
- [2026-06-27] Nim 全面优化（多轮审查修复）：
  **生成器**：随机生成替代 P-距离走步，P/N 自然分布，配合玩家自选先后手
  **交互**：提示/求解高亮推荐先后手按钮，求解自动选择+播放完整序列，撤销/重做触发 AI
  **修复**：最优步数对 Nim 隐藏、通关隐藏"解开了"、博弈树 memo 补全依赖、求解播放高亮石子、
  　　　　重置回到选择先后手、新关卡即时刷新卡片、P-position 空窗口期处理
  **文档**：L3 更新随机生成法+先手假设声明，清理过期伪代码，清理 4 个未使用 i18n key
  **经验**：lessons-learned.md 新增 §11 Nim 专项（人机对战模式、AI 调度、先后手机制等）
  测试 152/152 全过，typecheck 全绿
- [2026-06-27] **架构重构：游戏即插件 — Step 1–3**：
  - **Step 1**：创建 `packages/games/src/types.ts` — `GamePluginEntry<S, M>` 接口（BoardComponent / isOwnState / moveToHighlight / i18n / ui / ai / education / visualization 等 9 个字段）
  - **Step 1**：`GamePlugin` 接口新增可选 `ai?: { isAITurn, getAIMove }` 字段（`packages/core/src/types/plugin.ts`）
  - **Step 2**：26 个游戏专属文件从 core 迁回各游戏目录：
    - Lights Out：`solver.ts`（GF(2) 高斯消元）+ `generator.ts` + `types.ts`
    - Nim：`solver.ts` + `generator.ts` + `difficulty.ts` + `types.ts`
    - Wythoff：`solver.ts` + `generator.ts` + `difficulty.ts` + `types.ts`
    - Sudoku：`solver.ts`（DLX）+ `generator.ts` + `difficulty.ts` + `types.ts`
    - Sokoban：`solver.ts`（BFS）+ `solver-utils.ts` + `generator.ts` + `levels.ts` + `types.ts`
  - 所有 import 路径更新为本地引用（如 `'./solver'` 替代 `'@ludus/core'`）
  - 测试文件随源码迁移，import 路径同步更新
  - 196 测试全过，core / games / web typecheck 全绿
  - **Step 3 前置**：Nim + Wythoff 插件已实现 `ai` 字段（`isAITurn` + `getAIMove`），为 gameStore 重构做准备
  - 重构计划文档：`/Users/zxj/.claude/plans/drifting-dancing-wreath.md`（10 步，已完成 3 步）
- [2026-06-27] Wythoff 全面审查与修复（两轮）+ Nim 求解器优化：
  **Wythoff 修复**：
  - 同时取按钮截断：`Math.min(maxBoth, 6)` → 全部显示 + `max-h-48 overflow-y-auto`
  - FP 精度：`Math.floor(k * PHI)` → `Math.floor(k * PHI + 1e-12)` 三处统一
  - AI P 位置走法：从"取第一非空堆 1 颗"→"取较大堆 1 颗"（与 solveWythoffState 一致）
  - scheduleWythoffAI 同步修复（与 solve 函数一致）
  - L3 伪代码：`return null` → `return { moves: [] }`，中英双份
  - 难度选择器移除：固定每堆 1-10 颗，仅保留"新关卡"按钮，难度公式 `maxStone/10`
  - 文档 5 段式 header：改为 `## N. 中文 · English` 格式，stage 按钮正确链接
  - 石子渲染：容器固定高度 `maxContainerH(MAX_VISIBLE)`（与 Nim 一致），底部向上堆叠
  **Nim 修复**：
  - Nim-sum XOR bug：Wythoff 重构中误改为 `piles[0]^piles[1]`（只 XOR 前两堆），改回完整 `reduce`
  - `findWinningMove` 优化：从"遇第一个就返回"→"选剩余石子最少的必胜走法"（与 Wythoff 一致）
  **文档同步**：
  - Nim L3 伪代码 + §5.3 更新（最优化策略 + minimax 注释），中英双份
  - Wythoff L3 伪代码 + "求解"节更新（最优化策略 + minimax 注释），中英双份
  **验证**：196 测试全过，typecheck 零错误，vite build 成功
- [2026-06-27] **架构重构：游戏即插件 — Step 4–5（续）**：
  - **Step 4 — gameStore 去游戏化**：
    - 删除 `scheduleNimAI` / `scheduleWythoffAI`（共 38 行游戏专属 AI 逻辑）
    - 新增通用 `scheduleAI`（通过 `plugin.ai.isAITurn()` + `plugin.ai.getAIMove()` 实现）
    - 删除所有 `isAdversarial` 硬编码分支和 `findWinningMove`/`findWythoffWinningMove`/`isWythoffPPosition` 等游戏专属 import
    - `requestSolve`/`requestHint` 移除对抗游戏专属的 choosing phase 和 alternating solver 逻辑
    - gameStore: 590 → 455 行（23% 缩减），零游戏专属引用
  - **Step 5 — packages/ui 填充**：
    - 创建 `packages/ui/src/` 目录 + tsconfig.json
    - 5 个共享组件从 `apps/web/src/components/` 迁移至 `packages/ui/src/`（ErrorBoundary / ProgressiveDisclosure / GameToolbar / GameStatusBar / MarkdownRenderer）
    - `DisclosureLevel` 类型定义移至 packages/ui（消除 web→store 循环引用隐患）
    - web 添加 `@ludus/ui` 依赖，所有 import 更新为 `from '@ludus/ui'`
    - 删除 web 中的本地副本（5 个文件）
  - **验证**：314 测试全过（含 core 层旧副本），core / games / ui / web typecheck 全绿
  - 重构进度：10 步完成 5 步
- [2026-06-27] **架构重构：游戏即插件 — Step 6（续）**：
  - 5 款游戏新增 `GamePluginEntry` 导出（plugin/BoardComponent/isOwnState/moveToHighlight/i18n/education）
  - registry 新增 `entryRegistry` + `getGameEntry()` 函数
  - GameShell 状态校验 → `entry.isOwnState()`（消除 5 分支 if/else）
  - GameShell moveToCell → `entry.moveToHighlight()`（消除 30 行 switch + DIRECTION_DELTA import）
  - GameShell handleMove 类型从 5 游戏 union 简化为通用 `Move`
  - GameShell: 418 → 379 行
  - 314 测试全过，games/web typecheck 全绿
  - 重构进度：10 步完成 6 步
- [2026-07-08] **阶段 5e — 15-Puzzle (A* 搜索)**：
  - Core 层：A* 求解器（曼哈顿距离启发式 + MinHeap 优先队列）+ 随机走动生成器 + 难度公式 + 规则引擎
  - Game 层：FifteenBoard（CSS Grid 4×4 + Framer Motion layout 动画 + 键盘方向键 + 点击双交互）
  - Web 层：FifteenTreeViz（custom SVG，路径节点缩略图 + f/g/h 标注 + f 值趋势图）懒加载
  - i18n：中英 17 keys × 2 languages；教学：L2/L3 × zh/en 四份
  - 测试：29 新测试（规则 9 + 求解器 8 + 生成器 6 + 难度 6），总计 225 全过
  - 新增 13 文件（9 core + 4 edu），修改 5 文件（registry/zh-CN/en/entrySetup/worker）
  - isFastSolver: false（A* 后台 solve，不阻塞 UI）
  - 开发方式：Subagent-Driven Development × 3 batches，全程 typecheck + test 绿色
- [2026-06-28] **Docs 全面更新**：审计并修复 `docs/` 下所有过时内容：
  - `02-architecture.md`：更新 §1 分层架构图（移除 viz/i18n 包、Core solver/generator 子目录）、§1 依赖规则表、§2.1 包依赖关系图、§3 GamePlugin 接口（新增 ai 字段 + GamePluginEntry）、§6 目录骨架（完整重写为当前实际状态）、§7.3 Worker 策略、§2 小结（9 包 → 4 包）
  - `DECISIONS.md`：ADR-006 标记 ⚠️ SUPERSEDED（包清单被 ADR-023 取代）
  - `lessons-learned.md`：标题更新为多游戏范围，§1.1/§1.2 更新为 ADR-023 后架构，§9 检查清单加入 GamePluginEntry/零改动验证
  - `PROGRESS.md`：架构重构移入 DONE，IN PROGRESS 清空，NEXT ACTION 更新
  - `04-ui-design-system.md`：更新 viz 包路径为 apps/web 实际路径
  - `packages/education/`：删除死代码 ContentRenderer.tsx（TODO 骨架，无外部引用）
- [2026-06-28] **packages/games 全面修复**：
  - **i18n 自描述**：5 款游戏 entry.i18n 填入实际翻译数据（不再为空对象 `{zhCN:{},en:{}}`）
  - **难度分离**：Lights Out + Sokoban 新增 `difficulty.ts`，`getDifficulty` 从 rules.ts 移入独立文件
  - **Barrel 清理**：添加 `export * from './wythoff'`，移除冗余 Board 重导出，Wythoff 不再特殊处理。`chooseHand` 从 Nim/Wythoff 的 public export 移除（仅内部使用），消除命名冲突
  - **registry**：新增 `getAllEntries()` 函数
  - **VisualizationProps**：字段名对齐实际调用（`solveStepIndex`/`solvePlayback` 替代 `stepIndex`/`isPlaying`）
- [2026-06-28] **apps/web 消费者解耦**：
  - **entrySetup.tsx**：集中注入 web 专属依赖（education .md ?raw import + viz lazy 组件 + Sokoban toolbar），所有 entry 的 education.content 和 visualization 在此填充
  - **i18n/index.ts**：不再直接 import 游戏 i18n，改为遍历 `getAllEntries()` 动态合并翻译
  - **EducationPanel.tsx**：不再 import `educationContent.ts`/`vizComponents.tsx`，改为从 `entry.education.content` 和 `entry.visualization` 读取
  - **删除死代码**：`educationContent.ts`（集中式 .md import 映射）、`vizComponents.tsx`（集中式 viz 组件映射）
  - **新增游戏改动量**：从修改 3 个集中文件 → 仅需在 `entrySetup.tsx` 添加 1 个区块
- [2026-06-28] **packages/ui 全面修复**：
  - **ErrorBoundary.tsx**：硬编码英文字符串 "Something went wrong" / "Reload" → `t('app.error.title')` / `t('app.error.reload')`（类组件通过 ErrorFallback 函数组件桥接 useTranslation）
  - **GameStatusBar.tsx**：移除硬编码 gameId 检查（`gameId !== 'nim' && gameId !== 'wythoff'`），改为通用 prop `hideSolvedBadge`。GameShell 根据 `!!plugin?.ai` 传入
  - **package.json**：移除未使用的依赖 `react-dom`、`framer-motion` 及对应 `@types`；更新描述为实际组件列表
  - **i18n**：zh-CN.ts / en.ts 新增 `app.error.title`、`app.error.reload` key
- [2026-06-28] **对抗游戏 Solve 按钮修复**：
  - Nim/Wythoff 的 solver（solveNimState / solveWythoffState）返回玩家+AI 交替走子序列
  - `requestSolve` 原逻辑对所有游戏启动完整预计算播放，对抗游戏中 solver 模拟的 AI 走子与真实 AI（plugin.ai.getAIMove）不一致
  - 修复：新增 `adversarialPlayback` 状态 + `adversarialSolveStep` 逐步求解引擎
    - 每步动态调用 `plugin.solve()` 计算玩家最佳走子
    - AI 走子通过 `plugin.ai.getAIMove()` 真实计算（不再用 solver 的模拟值）
    - 玩家走子 → 600ms 后 AI 响应 → 600ms 后下一轮玩家走子 → 循环至终局或 P-position
    - 播放期间禁用 ◀▶ 手动步进按钮
  - **选先后手阶段支持**：
    - 新增 `hintHighlight` 字段（绕过 moveToHighlight 的直接高亮坐标）
    - Hint 选先后手阶段：求解 N/P-position → N 高亮"我先走"按钮，P 高亮"AI 先走"按钮
    - Solve 选先后手阶段：自动选择最优先后手 → 进入 playing 状态 → 启动逐步博弈播放
    - Nim/Wythoff render 已内置 highlightCell.row/col 选先后手高亮（row=0,col=0=先手, col=1=后手）
  - **选先后手时的高亮提示**：Solve 自动选择先后手后，先高亮按钮 800ms 展示选择，再开始播放
  - **最优解卡片实时更新**：
    - 对抗游戏中 solver 视角固定为"玩家先手"，但走子后轮到 AI，此时重求解会从错误视角得出空结果 → 卡片消失
    - 修复：`applyMove`/`undo`/`redo` 对抗游戏跳过自动重求解（`!plugin.ai`）
    - AI 走子后轮到玩家时，`scheduleAI` 自动重求解（视角一致），并更新 `solution` + `currentOptimalSteps`
    - 效果：卡片在每次 AI 响应后自动刷新为当前棋盘状态的最优解
  - **P-position 防御**：
    - `moveToHighlight` 添加 `!move` 空值守卫（Nim + Wythoff）
    - 博弈阶段 P-position 点击 Solve：不启动播放，仅返回求解结果（避免 `moves[0]` 为 undefined 导致崩溃）
- [2026-07-08] **全项目审计 + 5 项关键 bug 修复**：
  - **C1** (statusCards.tsx:62)：修复 Rules of Hooks 违规 — `useMemo` 从 `switch` 条件分支提升到组件顶层，消除游戏切换时崩溃风险
  - **C2** (i18n/index.ts:13)：添加 `entry.i18n` null guard + optional chaining，防止未初始化 entry 导致应用启动崩溃
  - **C3** (gameStore.ts:528)：`nextPlaybackStep` 添加 `!solvePlayback` 守卫，防止 stopPlayback 后的竞态条件
  - **C4** (lights-out/difficulty.ts + generator.ts)：统一 Lights Out 双难度公式为单一 `getDifficulty` 函数。Generator 改为调用 `getDifficulty(initialState)`，删除私有 `computeDifficulty`。修复非唯一解方向相反 bug（generator +10, rules -1.25）
  - **C5** (gameStore.ts)：`scheduleAI` + `scheduleBackgroundSolve` 保存 timeout ID 并在 `loadGame`/`newLevel` 时 `clearTimeout`，消除游戏切换竞态
  - 226 测试全过，typecheck 零错误，vite build 成功
- [2026-07-08] **A* 求解器修复 + 15-Puzzle 生成器修复**：
  - H1：`nodesExplored` 计数移至 `closedSet` 检查后，消除重复状态计数膨胀
  - H2：`findEmpty` 提升至邻居循环外，O(n²) → O(n)
  - H3：已解状态添加 retry loop（max 10），不再以已通关开局
- [2026-07-08] **死代码大清理（保持游戏独立性）**：
  - **删除死文件**：`nim/toolbar.tsx`、`wythoff/toolbar.tsx`（孤儿）、`ProgressiveDisclosure.tsx`（零消费者）
  - **删除死代码**：`serializeGrid`(fifteen)、`shouldUseWorker`(core)、Zod schema 从 core barrel 移除（全部未被导入）
  - **去重**：`findEmpty` 在 fifteen 内合并（solver 导入 rules）、`getPlayerStarts` 提取至 `utils/solution.ts`（apps/web 内共享，不跨游戏）
  - **Barrel 修复**：添加 `export * from './fifteen'` + `FifteenState/Move` 类型、移除未使用的 `LightsOutBoard` 导出
  - **不跨游戏共享**：Nim/Wythoff 石子渲染、`mulberry32` RNG 保持各游戏独立
  - 总计 -8 文件，-~280 行。226 测试全过，typecheck 零错误，vite build 7.19s
- [2026-07-08] **15-Puzzle 侧边栏/难度/i18n/教学内容全面修复**：
  1. **侧边栏状态卡片缺失**（statusCards.tsx）：新增 `case 'fifteen'`，展示曼哈顿距离、A* 展开节点数、最优解长度。此前 switch 无 fifteen 分支直接 fall through 到 `default: return null`
  2. **走子格式化缺失**（EducationPanel.tsx）：新增 `case 'fifteen'` formatMove 分支 + `FifteenMove` 类型导入，走子描述从 `JSON.stringify(move)` 原始 JSON → "滑动第X行第Y列的方块"
  3. **难度始终为 0**（rules.ts getDifficulty）：从 `computeFifteenDifficulty(0)` 硬编码 → 使用 `manhattanDistance(state.grid)` 动态计算 score（最大曼哈顿距离 60），随玩家推进实时更新
  4. **FifteenTreeViz 硬编码英文**：6 处硬编码英文（Collapse/Expand、"X steps"、节点说明文字、f 趋势标题、"Step N" 标签、"Xms"）全部替换为 i18n key，新增 8 个中英翻译 key
  5. **教学内容扩展**：L2 从 ~30 行扩展至 ~80 行（新增目标态图示、逐行逐列策略引导、逆序数可解性谜题、难度档位说明）；L3 从 ~89 行扩展至 ~200 行（新增 §3.2 逆序数详细判定 + 定理、§3.3.2 线性冲突启发式、§3.3.3 启发式对比表、§3.4 复杂度详细论证、§4.1 四种求解方法对比表、§4.2 更详细的伪代码与复杂度分析、§5 三种保证（可解性/最优解已知/难度可控）+ 难度因素表 + 难度档位表 + 生成策略对比表、延伸阅读 4 篇参考文献）
  6. **i18n 补齐**：新增 `education.fifteenMove`、`fifteen.collapse/expand/solutionPathSteps/nodeDescription/fTrend/stepN/timeMs` 共 8 个 key × 2 语言
  - 226 测试全过，typecheck 零错误，vite build 7.07s
- [2026-07-08] **15-Puzzle 难度选择器**：
  1. **Store**（gameStore.ts）：新增 `difficultyRange: [number, number]` 状态 + `setDifficultyRange` action。`generatePlayableState`/`loadGame`/`newLevel` 从 store 读取偏好
  2. **FifteenToolbar**（新建）：单个 `<select>` 下拉（简单/中等/困难/随机），选择即自动生成新关卡。替换默认 `newLevelSlot`，与工具栏按钮风格一致（圆角、warm-stone 底色、custom 下拉箭头 SVG）
  3. **注册**（entrySetup.tsx）：`fifteenEntry.ui = { toolbarSlot: FifteenToolbar }`
  4. **i18n**：新增 `difficulty.random` key（zh-CN / en）
  5. **generator.ts**：`scrambleDepthFromRange` 区间随机采样 → `[1,100]` 覆盖三档均匀分布
  - 226 测试全过，typecheck 零错误，vite build 8.16s
- [2026-07-08] **15-Puzzle 全面修复提交 + 推送**：35 文件变更，+1022/-423 行。涵盖难度修复+选择器、Web Worker 离线程求解、FifteenTreeViz 横向箭头重设计、侧边栏状态卡片、i18n 补齐、教学内容扩展、死代码清理。提交 `6191ac8`，已推送 origin/master。226 测试全过，typecheck 零错误。
- [2026-07-08] **倒水谜题交互 UX 重写 + 侧边栏补全 + 文档扩展**：
  - render.tsx 完全重写：点击壶体直接交互（点壶→选壶→点另一壶完成倒水，双击倒空）；消除 Pour 专用小按钮；壶体 hover/选中/接收三种视觉状态（环状高亮 + 脉冲动画 + 蒙层文字）；Fill/Empty 按钮增大（py-2 px-3 text-sm）；键盘快捷键（1/2/3 选壶，F/E 装满/倒空，Esc 取消）；点击容器外取消选择
  - statusCards.tsx 重写：3 列 StatCell 布局（对齐 Lights Out 标准）；新增当前水量/最优步数/探索节点显示；导入 isSolvable 替代错误启发式
  - rules.ts getDifficulty 统一为 BFS 深度公式（实时求解，与 difficulty.ts 一致）
  - i18n：新增 6 个交互提示 key × 2 语言
  - 教育文档扩展：添加 YAML frontmatter 至全部 4 文件；L2 70→110 行（+BFS 伪代码、复杂度标注、引导问题、操作提示）；L3 183→330 行（+必要性/充分性证明概要、唯一性讨论、难度因素贡献表、完整生成器伪代码、验证清单、生成策略对比表、6 篇延伸阅读）
  - 281 测试全过，typecheck 零错误，vite build 7.79s
- [2026-07-08] **阶段 5f — 倒水谜题完整实现**：
  - Core 层：WaterJugState/WaterJugMove 类型 + 规则引擎（legalMoves/applyMove/isSolved/gcd/isSolvable）+ BFS 求解器（状态去重 + 路径重构 + trace）+ 随机生成器（裴蜀定理验证可解 + 3 档难度容量范围）+ 难度公式（最优深度/25 归一化）
  - Game 层：WaterJugBoard 渲染（CSS SVG 水壶 + CSS 水位动画 + 装满/倒空/倒水三操作按钮 + pour 两步选择 UI）+ 完整插件 + manifest + i18n
  - Web 层：WaterJugTreeViz（BFS 路径节点水壶缩略图 + → 箭头 + 操作描述）+ statusCard（状态空间/GCD 信息）+ formatMove（装满/倒空/倒水三格式）
  - 教学：4 份 markdown（L2/L3 × zh/en），五段式结构，裴蜀定理推导 + BFS 伪代码 + 求解器对比表
  - 测试：55 新测试（规则 30 + 求解器 11 + 生成器 8 + 难度 6），总计 281 全过
  - typecheck 零错误，vite build 7.94s 成功。新增 13 文件，修改 7 文件。
  - SolverTrace type 新增 `'bfs-state-search'`。isFastSolver: true（BFS 即时求解）。
- [2026-07-08] **启动阶段 5f — 倒水谜题**：B.6 建议顺序第 4 款增量游戏，数论领域（裴蜀定理/GCD/BFS）。
- [2026-07-08] **15-Puzzle Web Worker 离线程求解 + 工具栏优化**：
  1. **FifteenToolbar** 改为紧凑下拉 +「+ 新关卡」按钮：选择难度自动生成，同难度可多次点击刷新
  2. **Web Worker 实现**（solver.worker.ts）：`solveFifteen` 导出 → 真正在独立线程运行 A\* 求解，不再阻塞 UI。Worker 创建/销毁生命周期由 `runSolverOffThread` 统一管理
  3. **Store 重构**（gameStore.ts）：
     - 新增 `runSolverOffThread(plugin, state, onResult, onError)` 通用离线程求解函数——fifteen 走 Worker，其他游戏走 setTimeout fallback
     - `scheduleBackgroundSolve` 改用 `runSolverOffThread`（之前是 `setTimeout(() => p.solve(s))` 主线程阻塞）
     - `requestSolve` 对 fifteen 改用 `runSolverOffThread`（之前 `setTimeout(() => p.solve(s))` 主线程阻塞）
     - 移除未使用的 `bgWorker` 变量，简化 `clearTimers`
  4. **导入修复**：Worker 从 barrel `@ludus/games` 改为直接 import solver 源文件（`@ludus/games/src/fifteen/solver`），绕过 barrel 中 React/framer-motion 等浏览器依赖，修复 `window is not defined`。Worker chunk 仅 5.3KB
  - 226 测试全过，typecheck 零错误，vite build 9.31s（含 worker chunk）
- [2026-07-08] **倒水谜题难度选择器 + 文档步数上界分析**：
  - **难度选择器**（`apps/web/src/components/WaterJugToolbar.tsx` 新建）：复用 FifteenToolbar 模式——`<select>` 下拉 Easy/Medium/Hard/Random 四档 +「+ 新关卡」按钮。选择难度即时生成新关卡。在 `entrySetup.tsx` 注册为 `waterJugEntry.ui.toolbarSlot`。
  - **L3 新增 §3.5「步骤上界分析」**（zh-CN + en）：完整数学推导——平凡图论上界（`maxDepth ≤ stateSpace−1`，松）→ 容量和上界（`maxDepth ≤ a+b−gcd(a,b)`，紧）→ 紧致性示例表（(11,12)→1 depth≈21 vs bound=23，紧致率 91%）→ N 壶推广（`sum(capacities)/minGCD`）→ 代码对应 `maxDepth = max(sum(capacities), 6)`。
  - **L3 §5.4 修正**：`maxDepth = 25`（过时经验值）→ `maxDepth = max(sum(capacities), 6)`（数学上界，引用 §3.5）。困难档位表「典型最优步数」：10–25 → 10–23。
  - **L2 微调**（zh-CN + en）：在 BFS 秒解说明后补充一句「步数也有上界：a+b−gcd(a,b)，约等于容量之和」。
  - 281 测试全过，typecheck 零错误，vite build 8.46s
- [2026-07-08] **倒水谜题难度系统校准 + 生成器拒绝采样**：
  - difficulty.ts：`maxDepth` 从固定 25 → 动态 `sum(capacities)`（数学上界 ≈ a+b），消除小容量子被过度惩罚的问题。新增状态空间加分（0-20 分），大容量子得分更高。实际举例：(3,5)→4 depth=6: 评分 25→60，(11,12)→1 depth≈21: 评分 84→74。
  - rules.ts getDifficulty：删除重复公式，改为调用 `computeWaterJugDifficulty` 单一来源
  - generator.ts 完全重写：
    - 智能目标选择 `pickTargetsByDifficulty`：按"非平凡性"排序候选目标（直接=某容量→惩罚100，=|c₁−c₂|→惩罚50，相对大小小的→惩罚20），困难模式从非平凡目标中选
    - 拒绝采样：生成容量和目标后运行 BFS 求解 → 计算实际难度分数 → 仅在落入请求难度区间时接受，最多重试 100 次
    - Fallback：100 次未匹配则返回最接近请求区间的候选；极端情况退回经典 (3,5)→4
    - uniqueSolution 修正：true → false（BFS 返回一条最短路径，不保证唯一）
  - 281 测试全过，typecheck 零错误，vite build 8.11s
- [2026-07-08] **倒水谜题全面审计与修复**：
  - 🔴 **L3 文档 §5.4 难度公式错误**（zh-CN + en）：文档描述单组件公式，实际代码使用双组件公式（深度 0–80 + 状态空间 0–20）。已修正为实际公式 + 分解说明。
  - 🔴 **L3 §5.5 伪代码过时**：缺少拒绝采样、optimalSteps<3 过滤、pickTargetsByDifficulty、fallback 链。已重写。
  - 🔴 **generator.ts 死代码**：targetPreference 变量三个分支执行完全相同代码。已移除变量、合并为单行。同时移除逻辑永假检查 capGcd > max(capacities)。
  - 🟡 **types.ts 4 个未使用常量**（MAX_CAPACITY/MIN_CAPACITY/MIN_TARGET/MAX_BFS_DEPTH）：已删除。
  - 🟡 **状态空间因素表**：从「间接指标」→「直接贡献 0–20 分加成」。
  - 281 测试全过，typecheck 零错误，vite build 8.32s
- [2026-07-08] **阶段 5g — Nonogram** 完整实现。首款 Canvas 渲染 + NP-complete 游戏。线求解+回溯搜索+唯一解验证。330 测试全过。
- [2026-07-08] **Nonogram 回溯搜索树可视化 + 生成器强化**：
  - **回溯搜索树可视化**（NonogramTraceViz.tsx）：SVG 树展示回溯分支过程。Leaf-counting 布局算法（叶节点依次排布，内部节点居中于子节点）。颜色编码：灰=线求解根节点、蓝=分支节点、绿=得解、红=矛盾。节点显示：格坐标(R行C列) + 猜测(■/✕) + 新确定格子数。Tab 切换线求解步骤 / 回溯搜索树。
  - **求解器增强**（solver.ts）：新增 `isFullyLineSolvable()` 导出函数，供生成器判断谜题是否纯线求解。
  - **生成器强化**（generator.ts）：
    - 网格尺寸升级：Easy 5×5、Medium 6×6–8×8、Hard 8×8–10×10（之前 Hard 仅 7×7–8×8）
    - 填充密度差异化：Easy 40-60%、Medium 30-45%、Hard 25-40%
    - Hard 谜题强制要求回溯（`backtracks > 0`），Medium 偏好回溯
    - Pattern 生成小块化（Hard 下 maxBlockSize=2 vs Easy=4）
  - **i18n**：新增 7 个翻译 key × 2 语言（回溯树标签、Tab、统计等）
  - 331 测试全过，typecheck 零错误，vite build 8.04s
- [2026-07-09] **Nonogram i18n 审计与修复**：
  - **Bug 修复**：`statusCards.tsx` 唯一解判断死代码 → 生成器保证唯一解
  - **i18n 硬编码修复**（`NonogramTraceViz.tsx`）：~15 处硬编码改为 `t()` 调用
  - **新增 i18n key**：19 个 key × 2 语言
  - 331 测试全过，typecheck 零错误，vite build 7.40s
- [2026-07-09] **全项目审查修复（36+ 项）**：
  - **P0 Bug**：Nonogram `solveNonogram` 回溯起点修正（`initial.state`）；`isSolved` 改为线索验证；gameStore 对抗播放 timer 可取消（`playbackController.ts`）；`adversarialPlayback` 全路径清理
  - **P1 Store**：异步求解 stale check；慢速游戏走子后 debounce 重求解；`reset`/`loadCustomState` 清 timer；求解中禁棋盘；`solveInFlight` 防并行
  - **P2 求解器**：Lights Out 生成器重复格重试 + requireUnique fallback 抛错；Sokoban 边死锁加 `isBox`；Water Jug `isSolvable` 短路；Nonogram 动态节点上限；Sudoku 超时返回 -1；Fifteen `scrambleDepth` 统一难度
  - **架构**：`GamePluginEntry` 新增 `formatEducationMove` + `ui.statusCard`；8 款游戏各 `education-ui.tsx`；`statusCards.tsx` 去游戏分支；Worker 按 `webWorker` 元数据路由（Lights Out/Fifteen/Sokoban）；Sokoban `isFastSolver: false`
  - **UI/i18n**：Lights Out/Sudoku Tailwind + aria i18n；EducationPanel 单实例 + 语言感知标题；entrySetup 声明式注册表
  - 331 测试全过，typecheck 零错误，vite build 5.80s
- [2026-07-09] **审查收尾工件**：
  - **StonePile 接入**：Nim/Wythoff `render.tsx` 迁移至共享 `packages/games/src/ui/StonePile.tsx`（含 `hintActive`、空堆占位）
  - **Sokoban Tailwind 化**：`render.tsx` 去除颜色常量内联 style，改用 design tokens；`BoardProps` 对齐；方向键 aria i18n
  - **风格统一**：Lights Out 难度阈值对齐 33/66；App 页脚/语言选择器 i18n；GameToolbar 演示停止按钮文案修正；对抗播放时禁用手动步进
  - **KNOWN ISSUES 清理**：音效已用 Web Audio API 合成（非空壳）；移除已完成的收尾项
  - 331 测试全过，typecheck 零错误
- [2026-07-09] **审查收尾工件（续）**：
  - **类型安全**：`entrySetup.tsx` 去除全部 `as any`（`isOwnState` 收窄）；`NonogramTraceViz`/`EducationPanel` 补全 viz 数据类型
  - **难度统一**：Sokoban 难度标签阈值对齐 33/66；新增 `lights-out/difficulty.test.ts`、`sokoban/difficulty.test.ts`
  - **Nonogram 生成器**：`config.seed` 直接使用（移除 `as any`）
  - 测试全过，typecheck 零错误
- [2026-07-09] **阶段 6a — Hub 主界面增强**：
  - **搜索**：按游戏名、描述、分类、标签实时筛选（中英双语）
  - **分类芯片**：5 个领域一键过滤（线性代数 / 约束满足 / 博弈论 / 搜索 / 数论）
  - **空状态**：无匹配时提示 + 清除筛选按钮；游戏计数显示
  - **纯函数**：`apps/web/src/utils/hubFilters.ts` + 6 单元测试
  - 345 测试全过，typecheck 零错误
- [2026-07-09] **阶段 6b — 进度 localStorage + Hero 继续游戏**：
  - **progressStore**：zustand persist（`ludus-progress-v1`），每游戏记录快照/通关次数/最近游玩
  - **gameStore 集成**：走子/撤销/重置/新关卡时自动保存；`loadGame({ resume })` 从快照恢复
  - **HubHeroCard**：最近游戏大卡 + 进度条 + 通关次数；点击带 `resume: true` 恢复状态
  - **GamePage**：路由 `location.state.resume` 区分「继续」vs「新开局」
  - 354 测试全过，typecheck 零错误
- [2026-07-09] **阶段 6b 修复 — 计时持久化**：
  - `GameProgressRecord` 新增 `elapsedMs`；离开游戏时 `flushProgress()` 保存用时
  - 继续游戏：`startTime = now - savedElapsed`，计时从上次累计值接着走
  - 已通关恢复：冻结 `elapsed`，不重启计时器
  - 新关卡/重置/新开局：计时归零
  - 359 测试全过
- [2026-07-09] **阶段 6c — 关卡设计单元通用 UI**：
  - **`@ludus/ui` `DifficultySelector`**：简单/中等/困难/随机四档（33/66 阈值），统一视觉
  - **`GeneratorToolbar`**：连接 `gameStore.difficultyRange` + 一键生成
  - **7 款游戏接入**：Lights Out / Sudoku / Nim / Wythoff / Fifteen / 倒水 / Nonogram 默认显示；Sokoban 保留关卡选择器
  - 删除 3 份重复 toolbar 实现（改为 re-export）
  - 361 测试全过，typecheck 零错误
- [2026-07-09] **Bug 修复 — 游戏页永久「加载中」**：
  - **根因**：6b 进度恢复后 `isOwnState` 校验失败 / Hub 链接残留 `resume:true` / `loadGame` 内 `solve` 抛错中断加载
  - **修复**：`loadGame` 恢复前校验 `isOwnState`、不匹配回退 `initialState`；Hub 网格显式 `resume:false`；`GamePage` 拆分 load/flush effect；`GameShell` 在 `isOwnState` 通过后再调 `isSolved`
  - 新增 `packages/games/src/load-smoke.test.ts`（8 游戏 generate + isOwnState 冒烟）
  - 377 测试全过，typecheck 零错误
- [2026-07-09] **UI 修复 — 侧边栏卡片 + 推箱子到位显示**：
  - Tailwind 补全 `clarity-teal` light/dark 别名；扫描 `packages/ui`
  - 侧边栏滚动容器改为 `flex + min-h-0` 布局
  - 推箱子到位：饱和 teal 渐变 + 描边 + ✓ 标记
- [2026-07-09] **阶段 6e — Hub 游玩统计条**：
  - `hubStats.ts` + `HubStatsBar.tsx`：总通关 / 开局次数 / 已尝试 / 已通关游戏
  - 成就占位徽章「即将推出」；数据来自 `progressStore` localStorage
  - 3 单元测试；380 测试全过
- **阶段 7 起步 — GitHub Actions CI** ✅：
  - `.github/workflows/ci.yml`：push/PR 触发；typecheck + 384 测试 + web/shell/pages build + 相对路径校验
  - 本地验证全绿
- **阶段 7 — GitHub Pages**（已关闭公开 deploy，个人账号不支持私有可见性）
- [2026-07-09] **阶段 6d — Tauri/Capacitor 套壳可行性**：
  - `apps/web build:shell`（Vite `--mode shell`，`base: './'`）
  - `apps/desktop`：Tauri 2 最小壳 + 图标 + `rust-toolchain.toml`
  - `apps/mobile`：Capacitor 6 配置 + sync 脚本
  - `docs/phases/06d-cross-platform-shell.md`；`shellPackaging.test.ts`
  - 383 测试全过；`build:shell` 验证相对路径 `./assets/...`
- [2026-07-09] **阶段 6d 本机验证 + beforeDevCommand 修复**：
  - 桌面壳 `pnpm dev:desktop` 可打开并游玩；`beforeDevCommand` 改为 `pnpm --filter ludus-web dev`（避免相对路径随 cwd 解析错误）
  - Vite dev：`host 127.0.0.1` + `strictPort 5173`（WebView2 兼容）
- [2026-07-09] **P2 清理**：移除死路由/Toolbar 重导出/statusExtension；CI 去掉 build:pages；更新 lessons-learned、02-architecture、.gitignore
- [2026-07-09] **P2 清理（续）**：移除未用 `pauseTimer`；`prependHistory` 加 `isOwnState` 校验；02-architecture 去 ProgressiveDisclosure、补 8 游戏
- [2026-07-09] **提交推送**：`d06fbdb` fix: post-audit cleanup and harden release CI（P1+P2+LICENSE）
- [2026-07-09] **Release + 移动端验证**：确认 `v0.1.0` Release 已产出 `.exe`/`.msi` Windows 安装包；`pnpm sync:mobile` 与 Capacitor Android doctor 通过；真机运行因本机 Android SDK/adb 未配置而阻塞。
- [2026-07-09] **桌面安装包空白页修复**：根因是 shell 构建 `BASE_URL='./'` 被传入 React Router 作为 `basename='.'`；新增 `resolveRouterBasename` 只保留绝对部署路径，shell/桌面不再设置 basename。新增 2 个回归测试；386 测试全过，`pnpm build:desktop` 成功产出 `.exe`/`.msi`。
- [2026-07-09] **v0.1.1 发布**：提交 `6e1a533`，推送 `v0.1.1` tag；GitHub CI 与 Release workflow 均成功，Release 已上传 `.exe`/`.msi`。注意资产文件名仍显示 `0.1.0`，需后续同步 Tauri/package 版本。
- [2026-07-09] **版本号同步**：apps/web、apps/desktop、apps/mobile、packages/core/games/education/ui、Tauri config、Cargo.toml/Cargo.lock 全部同步到 `0.1.1`；新增 shell packaging 测试防止发布版本再次不一致；更新 CHANGELOG/README。387 测试全过，`pnpm build:desktop` 产出 `Ludus_0.1.1_x64-setup.exe` / `Ludus_0.1.1_x64_en-US.msi`。
- [2026-07-09] **阶段 6c 教育面板出题生成器控制台**：新增设计 spec + 实现计划；`EducationPanel` 的 Create 卡片内嵌 `DifficultySelector` + `newLevel()`，用户可在阅读出题段时选择难度并立即生成关卡。新增 `educationSections.test.ts`，388 测试全过，`pnpm build:shell` 成功。
- [2026-07-09] **阶段 6c 高级生成器控制台**：新增 `apps/web/src/generatorControls.ts`，为 Lights Out / Sudoku / Nonogram 提供 typed generator-control metadata、默认参数、`LevelConfig.gameParams` 映射和生成摘要；`gameStore` 保存每游戏参数并记录 `lastGeneratedLevel`；`EducationPanel` Create 卡片升级为高级参数 UI；三款 generator 消费 `gameParams`（点灯尺寸/反向步数/唯一解/已知最优，数独线索数，数织尺寸/密度/回溯要求）。新增 schema/store/generator 回归测试，396 测试全过，`pnpm typecheck` 与 `pnpm build:shell` 成功。
- [2026-07-09] **Bug 修复 — Sudoku 高级生成参数未严格遵循线索数**：根因是 `generateSudokuLevel` 的挖空流程只做单轮贪心唯一解校验，显式 `gameParams.clues=20` 时可能停在 26 个给定数字；新增回归测试要求 20 线索 = 61 空格且唯一解。修复为显式线索数失败时使用 17 线索唯一解模板 + 数独等价变换 + 从完整解补足给定数字，保证 17–36 目标线索数精确落地且唯一解保持。397 测试全过，`pnpm typecheck` 与 `pnpm build:shell` 成功。
- [2026-07-09] **Bug 修复 — Toolbar 新关卡误用「出题」高级参数**：根因是 toolbar 与 Create 卡片共用 `gameStore.newLevel()`，而 `newLevel()` 总是读取 `generatorParamsByGame`，导致用户在「出题」设置线索数后，toolbar「新关卡」也继续套用该线索数。修复为 `newLevel()` 默认走普通难度生成；只有 Create 卡片显式调用 `newLevel({ useGeneratorParams: true })` 时才应用高级参数。新增 store 回归测试覆盖默认路径与高级路径隔离。398 测试全过，`pnpm typecheck` 与 `pnpm build:shell` 成功。
- [2026-07-09] **开发体验清理 — EducationPanel Fast Refresh invalidation**：Vite dev server 报 `getSectionViewModel` export 与 React Fast Refresh 不兼容；将该纯 helper 从 `EducationPanel.tsx` 移到 `educationSectionViewModel.ts`，组件文件仅导出 React component，减少本地 UX 冒烟时的 HMR 噪音。398 测试全过，`pnpm typecheck` 与 `pnpm build:shell` 成功。
- [2026-07-09] **移动端验证推进**：`pnpm sync:mobile` 成功，完成 `ludus-web build:shell` 与 Capacitor Android 资源同步（复制到 `apps/mobile/android/app/src/main/assets/public`）；`pnpm --filter ludus-mobile exec cap run android --list` 到 native-run 阶段后失败：`ERR_SDK_NOT_FOUND: No valid Android SDK root found`。本机 Java 可用、Capacitor CLI 6.2.1 可用、`cap doctor android` 报 success，但 `ANDROID_HOME`/`ANDROID_SDK_ROOT` 为空，`adb`/`emulator` 不在 PATH，常见 SDK 路径 `C:\Users\27491\AppData\Local\Android\Sdk` 不存在。下一步需安装/配置 Android Studio SDK 后继续真机/模拟器运行。
- [2026-07-09] **阶段 6c 高级生成入口调整**：根据产品语义调整信息架构：`EducationPanel` 的「出题」卡片不再承载参数控制台，只显示“出题不是随便调参数”的教学提示；高级生成控件迁入 `GeneratorToolbar` 的折叠二级面板，并抽出 `AdvancedGeneratorToolbarPanel.tsx`。默认 toolbar「新关卡」仍走普通难度生成，折叠面板中的“按参数生成”显式调用 `newLevel({ useGeneratorParams: true })`。398 测试全过，`pnpm typecheck` 与 `pnpm build:shell` 成功。
- [2026-07-09] **UI 调整 — 高级生成入口并入难度菜单**：为避免 toolbar 因新增“高级生成”按钮而拥挤换行，将高级生成入口放入 `DifficultySelector` 的下拉菜单中（难度项下方分隔后显示“高级生成/收起高级生成”）；选择普通难度仍立即普通生成，选择高级生成只展开/收起 `AdvancedGeneratorToolbarPanel`，参数面板仍在 toolbar 下方显示。398 测试全过，`pnpm typecheck` 与 `pnpm build:shell` 成功。
- [2026-07-09] **UI 调整 — 难度按钮宽度与高级生成可见性**：`DifficultySelector` 固定为紧凑宽度，避免“高级生成”长选项撑宽 toolbar；对尚未配置高级生成 spec 的游戏，难度菜单显示禁用项“高级生成（待支持）”，让能力状态可见但不提供不可用操作。398 测试全过，`pnpm typecheck` 与 `pnpm build:shell` 成功。
- [2026-07-10] **审计第一批修复**：移除 Sudoku 高级生成中无效的“唯一解”开关；`setGeneratorParam` 拒绝 `NaN`；`reset`/`undo`/`redo` 清理 stale `lastGeneratedLevel`；新增 `gameStore.prependHistory()` 并让 `GameShell` 通过 store action 持久化插件前置历史。新增 3 个 store 回归测试，401 测试全过，`pnpm typecheck` 与 `pnpm --filter ludus-web build` 成功。
- [2026-07-10] **审计第二批修复**：Nonogram playable state 彻底移除 `solution` 字段；`isOwnState` 改为校验 `lineSolveCells`/`maxBacktrackDepth`；Canvas 渲染用 `isSolved()` 判定通关；高级生成失败时 `newLevel({ useGeneratorParams: true })` 保留当前关卡并写入 `generatorError`，普通 toolbar 生成仍 fallback。新增 2 个 store 回归测试，404 测试全过，`pnpm typecheck` 成功。
- [2026-07-10] **架构债收敛 — 高级生成 metadata 插件化**：`GeneratorControlsSpec` 类型加入 `packages/games/src/types.ts`；Lights Out / Sudoku / Nonogram 各自 `generator-controls.ts` 并挂到 `GamePluginEntry.generatorControls`；`apps/web/src/generatorControls.ts` 改为通过 `getGameEntry()` 读取 spec 与 `buildLevelConfig`。新增 `packages/games/src/generator-controls.test.ts` 契约测试，408 测试全过，`pnpm typecheck` 成功。
- [2026-07-10] **审计第三批修复**：`difficultyRange` 全局字段改为 `difficultyRangeByGame` 按游戏记忆难度；`summarizeGeneratedLevel` 的 `generatedBy` 映射为 i18n key；`NonogramSolutionPreview` 挂到 `GamePluginEntry.ui.SolutionPreview`，`EducationPanel` 通过 entry 渲染最优解预览。409 测试全过，`pnpm typecheck` 成功。
- [2026-07-10] **移动端模拟验证**：用户暂缓真机验证；新增 `pnpm validate:shell`（`build:shell` + `shellBuildArtifacts.test.ts` 校验相对资源路径、`solver.worker`、Capacitor https scheme）；更新 `apps/mobile/README.md` 说明浏览器 preview 模拟 WebView。413 测试全过，`pnpm validate:shell` 成功。
- [2026-07-10] **审计第四批修复**：`DifficultySelector` 高级生成移出原生 select；`educationSectionParser.ts` 抽出五段式解析并加测试；`gameStoreLevelGeneration.ts` 承接 `generatePlayableLevel`/`fallbackLevel`；`generator-config.ts` 统一 mulberry32/参数读取。423 测试全过，`pnpm typecheck` 成功。
- [2026-07-10] **审计第五批修复**：`gameStoreSolverRuntime.ts` 抽取 AI 调度、后台求解、对抗播放、离线程求解与提示应用；Sudoku `generateSudokuLevel` 全随机路径改用 seeded RNG，`config.seed` 可复现同一盘面。425 测试全过，`pnpm typecheck` 成功。
- [2026-07-10] **审计收尾**：`gameStoreProgress.ts` 外置 `persistGameSession`；CI `.github/workflows/ci.yml` 改用 `pnpm validate:shell`；`shellBuildArtifacts` 在无 shell dist 时 skip。425 测试全过，`pnpm validate:shell` 成功。
- [2026-07-10] **v0.2.0 发布**：CI `22fbba5` 绿灯；版本号同步至 `0.2.0`；更新 CHANGELOG/README/CONTRIBUTING/`07-release.md`；打 tag `v0.2.0` 触发 Release workflow 产出 Windows 安装包。
- [2026-07-10] **围堵小偷设计启动**：用户选定方案 A（玩家放警察、AI 小偷逃边缘、警察不移动、方格+不规则轮廓）；中文名「围堵小偷」id=`thief-siege`；Angel and Devil 列为后续。写入 `docs/superpowers/specs/2026-07-10-thief-siege-design.md` 待评审。
- [2026-07-10] **围堵小偷 spec 确认 + 实现计划**：用户确认设计；写入 `docs/superpowers/plans/2026-07-10-thief-siege.md`（Task 1–5）。下一步按计划实现。
- [2026-07-10] **围堵小偷 Task 5 完成**：补齐 L2/L3 × zh-CN/en 教学、`EscapePathViz`、`entrySetup` wiring、`docs/games/thief-siege.md`；55 个测试文件 / 466 测试全过，`pnpm typecheck` 成功。
- [2026-07-10] **围堵小偷 Subagent-Driven 收尾**：Tasks 1–5 全完成于 `feat/thief-siege`（9 commits）；终审修复 maxCops 耗尽软锁（跳过警察回合继续小偷走）；规则/求解/生成/冒烟 57 测 + typecheck 绿。
- [2026-07-11] **围堵小偷 v1.1 设计对齐**：用户要求更大地图 + minimax 对抗 AI + 适当操作必胜；确认方案 A（易 11/中 15/难 19；混合可解保证；尽量完美 AI + Worker）。写入 `docs/superpowers/specs/2026-07-11-thief-siege-v1.1-design.md` 待审阅。
- [2026-07-11] **围堵小偷 v1.1 计划**：spec 确认；写入 `docs/superpowers/plans/2026-07-11-thief-siege-v1.1.md`（尺寸→对抗引擎→生成保证→Worker/AI→文档）。待选 Subagent-Driven / Inline。
- [2026-07-11] **围堵小偷 v1.1 Task 5 完成**：更新 L2/L3 × zh-CN/en 教学、`docs/games/thief-siege.md`、`docs/DECISIONS.md` ADR-024 与本进度文件；57 个测试文件 / 481 测试全过，`pnpm typecheck` 成功；v1.1 进入 DONE，NEXT 指向 Angel and Devil 或围堵小偷 polish。
- [2026-07-11] **围堵小偷 v1.1 final-review Important 修复**：generator 改为 irregular open-map 优先并保留 constructive fallback；同步 AI 改为 BFS-only；StatusCard 显示 `escape-adversary/<tier>` 档位；新增回归测试。`pnpm --filter @ludus/games exec vitest run src/thief-siege/` 与 `pnpm typecheck` 成功。
- [2026-07-14] **围堵小偷取消 Hub 注册**：用户反馈体验不佳；从 `registry` / `entrySetup` 移除，源码与单测保留；NEXT 转向独立模块 Angel and Devil 设计。
- [2026-07-14] **孔明棋设计启动**：用户选英式 33 孔、分级目标、完整教学求解器、经典+残局包；方案 A（bitmask+对称+Worker）；教学侧栏要求全面/严谨/有趣。写入 `docs/superpowers/specs/2026-07-14-peg-solitaire-design.md` 待审阅。
- [2026-07-14] **孔明棋 spec 确认 + 计划**：写入 `docs/superpowers/plans/2026-07-14-peg-solitaire.md`（geometry→solver→generator→plugin→重教学/viz）。待选执行方式。
- [2026-07-14] **孔明棋 Task 3 完成**：新增 puzzles / generator / difficulty 与 TDD 覆盖；生成器使用 seeded curated candidates + 轻量 dig-out，避免 full classic 重搜索；Peg 19 测与 `pnpm typecheck` 成功。
- [2026-07-14] **孔明棋 Task 4 完成**：新增 playable plugin UI、manifest/i18n、education-ui、registry/barrel/web entrySetup 与 Worker solve；Peg + load-smoke 39 测、`pnpm typecheck`、`pnpm --filter ludus-web build` 成功。
- [2026-07-14] **孔明棋 Task 5 完成**：新增 L2/L3 × zh-CN/en 重教学内容、`PegSearchViz`、entrySetup wiring、`docs/games/peg-solitaire.md` 与 ADR-025；`pnpm test:run` 与 `pnpm typecheck` 成功。
- [2026-07-14] **孔明棋 bugfix**：修复无解 curated 关、生成器未验证 fallback、非法走子污染 history、stuck/won UI、选子不同步、默认开局；Peg 21 测全过。
- [2026-07-14] **孔明棋难度/刷新修复**：goal 难度分对齐 Hub 三档；逆向合成换盘；新 seed + 切档显式传 range；Peg 25 测全过。
- [2026-07-14] **孔明棋 spec 纠偏**：生成器恢复经典+精选+挖空验证；React Flow 主变例；Hub 默认 hard；ADR-025/文档同步。
- [2026-07-14] **孔明棋 v1.1 设计（待审）**：用户确认难度方案 A；关卡改为经典合集、取消程序化生成与 le3 游玩目标。Spec：`docs/superpowers/specs/2026-07-14-peg-solitaire-catalog-design.md`。
- [2026-07-14] **孔明棋 v1.1 合集选关落地**：catalog picker、双目标、教学/ADR-026；Peg 26 测全过。
- [2026-07-14] **孔明棋 v1.2 模式+选关**：取消难度 UI；`PegSolitaireToolbar`（剩一/中心剩一+名局）；教学/spec/ADR 同步；Peg 22 测、web tsc 通过。
- [2026-07-14] **孔明棋合集扩充**：教科书名局（希腊十字/金字塔/箭头/菱形等）+ 中心归心变体；解释双模式列表为何不同。
- [2026-07-14] **孔明棋最优步数修复**：后台重求解不再覆盖开局最优；选关写入合集 `knownSolutionLength`（= 子数−1）。
- [2026-07-14] **孔明棋 viz/记号/公式修复**：求解器 `sampleSolutionTree` 主变+旁支采样；孔位英式 a–g×1–7（中心 d4）；状态卡对齐 Sokoban；Markdown 支持 `\(...\)` 并改写 peg 教学内容公式。
- [2026-07-14] **孔明棋求解叙事+viz 配色**：教育文档澄清 BFS/DFS 分工与高效剪枝边界；`PegSearchViz` 改为 indigo knowledge-card 壳（对齐 Sokoban BFSTreeViz）。
- [2026-07-14] **「当前棋盘状态」配色**：`GameCard`/`StatCell` 改为 indigo 壳，与 Live Analysis 的 KnowledgeCard / 搜索树一致。
- [2026-07-14] **孔明棋棋盘坐标**：棋盘外缘标注列 a–g、行 1–7（中心 d4），与走子/可视化记号一致。
- [2026-07-14] **孔明棋全面审查**：核心规则/记号/合集小关可靠；P0=Hub 首进非经典 seed、Worker solve 超时仍 playback；P1=文档 ADR 冲突、optimalSteps 未入顶栏、大盘 5s DFS 难解；风格大体对齐 Sokoban。
- [2026-07-14] **孔明棋审查修复落地**：Hub seed0+optimalSteps；Worker timeout 不 playback；isSolved 看 goal；大盘跳过后台搜；ADR-025 勘误；Collection 抽离；i18n/死代码清理；合集≤20 子验最优长。
- [2026-07-14] **孔明棋 viz 回归**：后台求解始终跑以供采样树；合集最优不覆盖；超时仍挂 trace。
- [2026-07-14] **孔明棋二次审查修复**：resume 读 progress.optimalSteps；bg timeout 不把 opening 最优塞进 remaining；错误音仅 `solveError`；hint 超时提示；viz Length 超时显示 —。

# PROGRESS.md — Ludus 项目进度（唯一真相源）

> 本文件让任何一个全新的 Claude 实例仅凭它即可接续工作。
> 每次完成工件后按 CLAUDE.md A.3 更新本文件。

## 📍 CURRENT STATE

- **当前阶段**：**阶段 5（增量游戏）进行中— 数独 (Sudoku) 已完整实现**。下一步：下一款游戏或 Sokoban 生成器升级
- **MVP 范围**：3 款游戏（Lights Out ✅ + Sokoban ✅ + Sudoku ✅）。
- **Backlog**：162 款游戏，覆盖 16 个原理领域 × 4 个参考平台。
- **代码库状态**：3 包 monorepo（core / games / web），~80+ 个源文件，108 个测试（全过），Vite 构建成功，React Flow 懒加载。
- **测试覆盖**：GF(2) 求解器 16 测 / Lights Out 规则 18 测 + 生成器 5 测 / Sokoban 规则+BFS+关卡 20 测 + 生成器 7 测 + 难度 3 测 / DLX 求解器 16 测 + 生成器 5 测 + 数独规则 14 测 + 难度 4 测 = **108 测试全过**。

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
  - ContentRenderer 组件接口定义 + 骨架
  - **§5 已按四种保证机制重写**（可解性/唯一解/最优解/难度可控 + 策略对比表）
  - **Markdown 格式修复**：全 11 个 .md 文件扫描，修复嵌套代码块高亮冲突、LaTeX 转义、占位符、裸 `<`、中文引号等 8 处问题
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
- **阶段 4 垂直切片 — Lights Out 端到端样板** ✅：

  - **Core 层**：GF(2) 高斯消元求解器 (`solveGF2`/`optimalSolution`/`buildLightsOutMatrix`) + 反向求解生成器 (`generateLightsOutLevel`) + Worker 消息协议 (`shouldUseWorker`)
  - **Game 层**：Lights Out 完整插件（rules/solver/generator/manifest/render/plugin） + 游戏注册表
  - **Web 层**：`apps/web/` 全栈骨架（Vite + React 18 + Tailwind + Framer Motion + React Router v6 + Zustand + react-i18next + Howler.js）
  - **UI 组件**（11 个）：HubPage / GamePage / GameShell / GameToolbar / GameStatusBar / ProgressiveDisclosure / KnowledgeCard / EducationPanel / MatrixViz / SolverStepPlayer / LightsOutBoard
  - **Web Worker**：`solver.worker.ts` + Vite `?worker` 动态加载 + store 条件分流（大状态走 Worker）
  - **i18n**：中/英双语言完整覆盖，language switcher 可用
  - **单元测试**：38 测试全过（gf2.test.ts 16 / rules.test.ts 17 / generator.test.ts 5）
  - **验证通过**：(a) 三层体验同实例切换 (b) `vite build` 成功 (c) 中英双语覆盖 (d) Worker 基础设施就绪
  - **构建产物**：dist ~568KB (gzip ~160KB)，React/Motion/Router/Worker 分包

## 🚧 IN PROGRESS

- **Sokoban 高质量生成器**（待做——参考学术资料实现反向行走/模板拼接/进化算法）

## 🔖 NEXT ACTION（下一次会话第一步）

下一款游戏: Nim/Wythoff (博弈论) 或继续 Sokoban 生成器升级。

### 选项 A：Nim/Wythoff（博弈论）

继续增量游戏——见 `docs/phases/00-backlog.md` §4 博弈论单元。可实现 Nim 完整求解（Sprague-Grundy）+ Wythoff 游戏 + 教学。

### 选项 B：Sokoban 生成器升级

参考学术资料（Rolling Stone 反向行走 / Murase 模板拼接 / Ashlock 进化算法）实现高质量关卡生成器。

## 🐛 KNOWN ISSUES

- `packages/ui` / `packages/viz` 尚未提取（ADN-022：≥2 游戏共享时提取）
- 音效文件（.mp3 audio sprite）尚未制作，`useSound` hook 与 Howler.js 封装已就绪
- EducationPanel 当前使用内联内容，尚未动态加载 .md 文件（ContentRenderer 骨架已存在）
- 4×4 和 5×5 Lights Out 矩阵不可逆（nullity 4/2），唯一解不可能——生成器有 fallback 处理
- `packages/i18n` 为空壳（package.json 存在但无 src），`npm run typecheck` 在根目录会因该包而失败
- `LightsOutBoard` 的 `aria-label`（`render.tsx`）为硬编码英文，因 packages/games 无 react-i18next 依赖
- Sokoban BFS 求解器在主线程执行，中大关卡可能超时或卡 UI——Worker 基础设施（`solver.worker.ts`）就绪但未接入 `shouldUseWorker` 分流逻辑
- Sokoban 生成器为 Microban 选关（v0.1），尚未实现高质量程序化生成（反向行走/模板/进化）
- 侧边栏布局已确定终局方案：flex `items-start` + ResizeObserver 左列高度测量 + 右列 `height` 同步（非 `min-height`）。见 memory `lessons-learned.md` §9.4。

## 📌 OPEN QUESTIONS / 待我确认

- 阶段 5 是否先做数独（DLX），再做 Nim（博弈论）？NEXT ACTION 已建议此顺序。
- 是否需要在阶段 5 前先提取 `packages/ui`（GameShell 等已被 1 款游戏使用，需 ≥2 才达到提取阈值）？

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

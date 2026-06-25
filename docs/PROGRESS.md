# PROGRESS.md — Ludus 项目进度（唯一真相源）

> 本文件让任何一个全新的 Claude 实例仅凭它即可接续工作。
> 每次完成工件后按 CLAUDE.md A.3 更新本文件。

## 📍 CURRENT STATE

- **当前阶段**：**阶段 4（垂直切片 — Lights Out 端到端样板）已完成**。全链路打通：Core 逻辑 → Game 插件 → Web 前端 → Worker → 测试。下一步进入 **阶段 5（增量游戏 — 数独 + Nim/Wythoff）**。
- **MVP 范围**：3 款游戏（Lights Out ✅ + 数独 + Nim/Wythoff）。
- **Backlog**：162 款游戏，覆盖 16 个原理领域 × 4 个参考平台。
- **代码库状态**：3 包 monorepo（core / games / web），46 个源文件，39 个测试（全过），Vite 构建成功，Worker 正确分包。
- **测试覆盖**：GF(2) 求解器 16 测 / Lights Out 规则 17 测 / 生成器 5 测 = **38 测试全过**。

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

- 无。

## 🔖 NEXT ACTION（下一次会话第一步）

以 **游戏引擎开发 + 算法工程师角色** 进入 **阶段 5 增量游戏**：

### 阶段 5a — 数独（Sudoku）
1. Core: DLX (Dancing Links / Algorithm X) 求解器 (`packages/core/src/solver/dlx.ts`)
2. Core: 数独生成器（挖空 + DLX 验证唯一解）
3. Game: `packages/games/src/sudoku/` 完整插件（rules/solver/generator/manifest/render/plugin）
4. 五段式教学内容（L2/L3 × zh/en）
5. Web: SudokuBoard 渲染组件 + 教学面板
6. 单元测试：DLX 求解器正确性、生成器唯一解验证

### 阶段 5b — Nim / Wythoff（组合博弈论）
7. Core: Minimax + Nim-sum + Grundy 数求解器
8. Game: `packages/games/src/nim/` 插件（含 Nim/Wythoff/Nimble 三变体）
9. 五段式教学内容
10. Web: Nim 堆可视化 + 博弈树组件（React Flow）

详见 `docs/phases/00-backlog.md` §2 组合博弈论、§4 CSP/SAT。

## 🐛 KNOWN ISSUES

- `packages/ui` / `packages/viz` 尚未提取（ADN-022：≥2 游戏共享时提取）
- 音效文件（.mp3 audio sprite）尚未制作，`useSound` hook 与 Howler.js 封装已就绪
- EducationPanel 当前使用内联内容，尚未动态加载 .md 文件（ContentRenderer 骨架已存在）
- 4×4 和 5×5 Lights Out 矩阵不可逆（nullity 4/2），唯一解不可能——生成器有 fallback 处理
- `packages/i18n` 为空壳（package.json 存在但无 src），`npm run typecheck` 在根目录会因该包而失败
- `LightsOutBoard` 的 `aria-label`（`render.tsx`）为硬编码英文，因 packages/games 无 react-i18next 依赖
- Worker (`solver.worker.ts`) 尚未被 store 实际使用——Worker 基础设施就绪但未接入 `shouldUseWorker` 分流逻辑

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


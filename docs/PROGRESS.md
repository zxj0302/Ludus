# PROGRESS.md — Ludus 项目进度（唯一真相源）

> 本文件让任何一个全新的 Claude 实例仅凭它即可接续工作。
> 每次完成工件后按 CLAUDE.md A.3 更新本文件。

## 📍 CURRENT STATE

- **当前阶段**：阶段 3 已确认完成 → 即将进入 **阶段 4（垂直切片 — Lights Out 端到端样板）**。全部前置决策已敲定（状态管理/路由/音效/启动边界），可随时开工。
- **MVP 范围**：3 款游戏（Lights Out + 数独 + Nim/Wythoff）。
- **Backlog**：162 款游戏，覆盖 16 个原理领域 × 4 个参考平台（Simon Tatham / GamesCrafters / cut-the-knot / Red Blob Games）。
- **代码库状态**：monorepo 骨架 + Core 类型/schema + Education 层 L2/L3 教学内容 + ContentRenderer 骨架 + UI 设计系统文档 + 22 项 ADR 全部就绪。

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

## 🚧 IN PROGRESS

- 无。阶段 3 已确认完成，等待用户指令进入阶段 4。

## 🔖 NEXT ACTION（下一次会话第一步）

以 **游戏引擎开发 + 算法工程师角色** 进入 **阶段 4 垂直切片 — Lights Out 端到端样板**。按 ADR-022 仅开发 3 个包（`packages/core` + `packages/games` + `apps/web`）。

### 0. 项目骨架（先建包）
0a. `packages/core/` — 已有 `types/` + `schema/`，追加 `solver/` + `generator/` + `worker/`
0b. `packages/games/` — Lights Out 模块（rules/solver/generator/manifest/render）
0c. `apps/web/` — Vite + React + Tailwind + Framer Motion + React Router v6 + Zustand + i18n + Howler.js 骨架

### 4a. 核心逻辑（Core + Game 层）
1. `packages/core/src/solver/gf2.ts` — GF(2) 高斯消元求解器（纯 TS）
2. `packages/core/src/generator/reverse.ts` — 反向求解生成器
3. `packages/core/src/worker/solver-task.ts` — Worker 任务抽象（求解/生成消息协议）
4. `packages/games/src/lights-out/rules.ts` — 规则引擎
5. `packages/games/src/lights-out/solver.ts` — 调用 GF(2) 求解器
6. `packages/games/src/lights-out/generator.ts` — 关卡生成器（唯一解/最优解）
7. `packages/games/src/lights-out/manifest.ts` — educationManifest + visualizationManifest + soundManifest
8. `packages/games/src/lights-out/index.ts` — LightsOutPlugin implements GamePlugin
9. `packages/games/src/registry.ts` — 游戏注册表

### 4b. 单元测试
10. GF(2) 高斯消元测试、规则测试、生成器唯一解/最优解测试

### 4c. 可玩 UI（按 ADR-022 先放 apps/web）
11. `apps/web/src/components/GameShell.tsx` — 游戏容器（Zustand store + 撤销/重做/重置/Worker 调度）
12. `apps/web/src/components/GameToolbar.tsx` / `GameStatusBar.tsx`
13. `apps/web/src/components/ProgressiveDisclosure.tsx` / `KnowledgeCard.tsx`
14. `apps/web/src/router.tsx` — React Router v6（`/` → Hub 占位, `/game/lights-out` → 游戏）
15. `apps/web/src/stores/gameStore.ts` — Zustand store（gameState/history/disclosureLevel/solverStatus）
16. `apps/web/src/i18n/` — react-i18next 配置 + Lights Out 中/英 UI 字符串
17. `apps/web/src/hooks/useSound.ts` — Howler.js 封装
18. `packages/games/src/lights-out/render.tsx` — Lights Out 棋盘组件（DOM + Framer Motion）

### 4d. 教学与可视化（按 ADR-022 先放 apps/web，不在阶段 4 创建 packages/viz）
19. `apps/web/src/components/EducationPanel.tsx` — L3 深度教育面板（Drawer，渲染完整教学内容 + LaTeX + 伪代码）
20. `apps/web/src/components/MatrixViz.tsx` — GF(2) 增广矩阵行变换基础可视化（DOM 表格 + Framer Motion 行高亮/消元动画，不依赖 React Flow/D3）
21. `apps/web/src/components/SolverStepPlayer.tsx` — 求解步骤播放控制器（播放/暂停/步进/调速）

### 4e. 验证目标
22. (a) 三层体验同实例切换 (b) Web 全链路 vite build + 静态部署 (c) 中英双语切换 (d) >500ms 求解走 Web Worker

写入 `docs/phases/04-vertical-slice.md`（阶段总结），更新本文件。

## 🐛 KNOWN ISSUES

- 无（尚无业务逻辑代码，仅有类型/schema/教学内容）。

## 📌 OPEN QUESTIONS / 待我确认

- 无。阶段 0–3 已全部确认，可随时进入阶段 4。

## 📝 SESSION LOG

- [初始化] 创建 docs 骨架，写入 CLAUDE.md / DECISIONS.md / 00-backlog.md / PROGRESS.md。
- [2026-06-25] 阶段 0 完成；用户确认全部默认建议 → ADR-006~008, 013~017 转 ACCEPTED。
- [2026-06-25] 阶段 1 完成（三层画像 + 故事地图 + MoSCoW + 路线图 + MVP 边界）；用户确认。
- [2026-06-25] 阶段 2 完成（四层架构 + 9 包 monorepo + GamePlugin v1.0 + 3 zod schema + migrator + 平台矩阵）；已创建 `packages/core/src/` 完整类型与 schema 源码。
- [2026-06-25] 阶段 3 完成（五段式模板 + 创作指南 + Lights Out 4 份教学内容 L2/L3 × zh/en + ContentRenderer 接口骨架）；已强化 §5 按四种保证机制重写；Markdown 格式修复 8 处。
- [2026-06-25] 阶段 3 确认完成 + 历史修订：去掉微信小程序降级痕迹。
- [2026-06-26] **UI 设计系统**：`docs/phases/04-ui-design-system.md` — Playful Bento 完整设计系统。ADR-018 录入。
- [2026-06-26] **阶段 4 前置决策**：ADR-019 (Zustand) / ADR-020 (React Router v6) / ADR-021 (Howler.js 阶段 4 即做) / ADR-022 (最小包启动) → ACCEPTED。NEXT ACTION 扩展到 22 步。
- [2026-06-26] **四轮全项目审计与修复**：
  - R1：音效优先级/ADR 编号/LaTeX 语言等 9 处修正
  - R2：补算法可视化步骤(MatrixViz+SolverStepPlayer)+EducationPanel；架构文档标注实现状态等 13 处
  - R3：bfs.ts/dfs.ts/pool.ts 标记修正、worker 文件重命名等 3 处
  - R4：LaTeX typo/桌面移动端注释/产物文件列表/字体/MoSCoW 措辞/ADR 描述等 11 处
  - 合计修复 **36 处**问题，全部阶段文档 + DECISIONS + CLAUDE 一致性验证通过
- [2026-06-26] **竞品分析与 Backlog 大规模扩充**：
  - 竞品调研 8 平台（Brilliant/CodinGame/Zachtronics/VisuAlgo/Euclidea/AlgoQuest/Sokoban/AlgoViz）
  - 集成 4 个参考平台游戏清单：Simon Tatham (40 款) / GamesCrafters (62+11) / cut-the-knot (数百) / Red Blob Games (~80 交互)
  - `docs/phases/00-backlog.md`：**74 → 162 款**（+88 款，+119%），16 个原理领域全覆盖
  - 早期开发顺序 6 → 8 款（+Connect 4 / +Peg Solitaire）
  - 新增"优先采用权威实现"政策 + 🔗 权威/参考实现索引（Oxford/Kaikoku/CGSuite/Chinook/SGT puzzles MIT 源码等）
  - Simon Tatham 40/40 全覆盖、GamesCrafters 核心全收录、cut-the-knot 核心谜题全收录

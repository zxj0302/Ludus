# PROGRESS.md — Ludus 项目进度（唯一真相源）

> 本文件让任何一个全新的 Claude 实例仅凭它即可接续工作。
> 每次完成工件后按 CLAUDE.md A.3 更新本文件。

## 📍 CURRENT STATE

- **当前阶段**：阶段 3 已确认完成 → 即将进入 **阶段 4（垂直切片 — Lights Out 端到端样板）**，这是项目最关键的里程碑。
- **MVP 范围**：3 款游戏（Lights Out + 数独 + Nim/Wythoff）。
- **代码库状态**：monorepo 骨架 + Core 类型/schema + Education 层 L2/L3 教学内容 + ContentRenderer 骨架。

## ✅ DONE

- 录入项目宪法与会话协议：`CLAUDE.md`
- 录入决策记录：`docs/DECISIONS.md`（ADR-000~017 全部 ACCEPTED）
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

## 🚧 IN PROGRESS

- 无。阶段 3 已确认完成，等待用户指令进入阶段 4。

## 🔖 NEXT ACTION（下一次会话第一步）

以 **游戏引擎开发 + 算法工程师角色** 进入 **阶段 4 垂直切片 — Lights Out 端到端样板**。这是项目最关键的里程碑，需依次产出：

### 4a. 核心逻辑（Core + Game 层）
1. `packages/core/src/solver/gf2.ts` — GF(2) 高斯消元求解器（纯 TS，可单测）
2. `packages/core/src/generator/reverse.ts` — 反向求解生成器
3. `packages/games/src/lights-out/rules.ts` — Lights Out 规则引擎（initialState, legalMoves, applyMove, isSolved）
4. `packages/games/src/lights-out/solver.ts` — 调用 GF(2) 求解器
5. `packages/games/src/lights-out/generator.ts` — 关卡生成器（唯一解/最优解）
6. `packages/games/src/lights-out/manifest.ts` — educationManifest + visualizationManifest
7. `packages/games/src/lights-out/index.ts` — LightsOutPlugin implements GamePlugin
8. `packages/games/src/registry.ts` — 游戏注册表

### 4b. 单元测试
9. GF(2) 高斯消元测试、Lights Out 规则测试、生成器唯一解/最优解测试

### 4c. 可玩 UI
10. `packages/games/src/lights-out/render.tsx` — 棋盘组件（DOM + Framer Motion）
11. `packages/ui/src/GameShell.tsx` — 游戏容器（撤销/重做/重置/胜利判定/Worker 调度）
12. `apps/web/` — Vite + React 骨架，路由 `/game/lights-out`

### 4d. 验证目标
13. (a) 三层体验在同一实例切换 (b) Web 全链路静态部署 (c) 中英双语切换 (d) 重计算走 Web Worker

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
- [2026-06-25] 阶段 3 完成（五段式模板 + 创作指南 + Lights Out 4 份教学内容 L2/L3 × zh/en + ContentRenderer 接口骨架）。**已强化 §5**：按四种保证机制重写 Lights Out L3 教学内容（可解性/唯一解/最优解/难度可控 + 策略对比表 + 难度验证闭环）。
- [2026-06-25] **Markdown 格式修复**：全 11 个 .md 文件扫描。修复 8 处：(1) l3.zh-CN.md `\\%` → `\%` (2) l3.zh-CN.md `\pmod{?}` → 具体尺寸 (3) DECISIONS.md 节名修正 (4)(5) 两处裸 `<` → `＜` (6) 03-education-framework.md 嵌套代码块 `markdown` 语言标记导致高亮冲突 → 移除标记 (7) LaTeX 矩阵块改用 4 空格缩进 (8) 中文引号 → 直角引号 + `{{}}` → `{ { } }` 防模板误解析。
- [2026-06-25] **阶段 3 确认完成**：更新 PROGRESS.md，整理进度，提交阶段性成果。

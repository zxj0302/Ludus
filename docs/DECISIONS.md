# Ludus 决策记录（DECISIONS.md / ADR 摘要）

> 本文件追加式记录所有"已确认"的决策与架构决策记录(ADR)摘要。
> 规则：只追加、不回退；如需推翻旧决策，新增一条并在旧条目标注"⚠️ 已被 ADR-XXX 取代"。
> 每个全新会话须读此文件，确保产出不与既定决策冲突。

## 决策状态图例

- ✅ ACCEPTED：已确认，必须遵守
- 🔶 PROPOSED：已提出，待用户确认（不得据此写正式代码）
- ⚠️ SUPERSEDED：已被新决策取代

---

## 一、平台与跨端

### ADR-009 平台优先级

- **状态**：✅ ACCEPTED
- **决策**：Web 为第一优先级，直接部署为首要入口。架构须保证在"不重写"前提下扩展到桌面端(Tauri，系统 WebView 套壳)与移动端(Capacitor，原生 WebView 套壳)。微信支持为可选、非必要：以微信内 H5 覆盖最低获客需求；微信小程序列为未来独立任务，不约束主架构。不走 Steam/桌面原生精品化路线。
- **理由**：「标准 Web + 壳封装」路线最干净，三端复用同一份代码；微信内 H5 保留传播能力但不让封闭运行时约束架构。
- **风险**：微信内 H5 在性能/分享体验上弱于原生小程序；若未来小程序转为重点需另起适配任务。

### ADR-010 跨端方案：React + Tauri + Capacitor

- **状态**：✅ ACCEPTED
- **决策**：三端复用同一 React 代码库。Web 直接部署为首要入口；桌面端用 Tauri 套壳（系统 WebView，体积小，优于 Electron）；移动端用 Capacitor 套壳（原生 WebView 复用网页）。
- **理由**：Capacitor/Tauri 均为"复用同一份 Web 代码、外层套壳"，天然满足"不重写"诉求；区别于 React Native 需用原生组件重写 UI。
- **影响**：不走 Steam/桌面原生精品化路线；桌面以 Tauri 轻封装覆盖。
- **风险**：Capacitor 基于 WebView，高帧率连续动画弱于原生；本品类多为回合/步进式，影响可控。

---

## 二、核心逻辑与渲染

### ADR-001 核心逻辑层语言 TypeScript

- **状态**：✅ ACCEPTED
- **决策**：Core Logic 层用 TypeScript，且**框架无关**（不依赖 React、不依赖 DOM、不依赖 Node-only API）。游戏规则、求解器、关卡生成器均置于此层。
- **理由**：可单元测试、可放入 Web Worker 跑重计算以避免阻塞 UI、未来可移植（换渲染框架或小程序适配时逻辑零改动）。
- **影响**：重型求解器优先纯 TS 实现；Web/移动可选 WASM 加速，但**始终保留纯 TS 回退路径**。

### ADR-011 可视化与渲染分层

- **状态**：✅ ACCEPTED
- **决策**：
  1. **算法可视化层**（解释算法内部计算流程）：React Flow 负责节点图/搜索树/博弈树/自动机/电路/约束图；D3.js 负责自定义数据可视化（高斯消元行变换、概率分布、信息熵演化等）。两者**按需懒加载**，不进首屏包。
  2. **游戏本体渲染层**：默认 DOM + Framer Motion；架构允许每个游戏自选渲染后端，重网格/高频动画游戏（生命游戏、大网格、粒子反馈）可切换 Canvas（react-konva 或 PixiJS）。
  3. **重计算**：走 Web Worker；求解器可选 WASM 加速但保留纯 TS 回退（与 ADR-001 一致）。
- **理由**：分离"游戏渲染"与"算法解释渲染"两类不同需求；为大网格/高频动画预留性能出口。
- **影响**：游戏单元接口须声明其渲染后端（DOM / Canvas）。

### ADR-012 美术与手感投入定位

- **状态**：✅ ACCEPTED
- **决策**：技术栈（Framer Motion + Tailwind）确保不拖累美观与趣味，但承认可玩性/趣味/美观主要由设计投入决定（动效曲线、配色、音效、关卡节奏）。每个游戏 DoD 须包含"手感反馈"与"基础美术打磨"项。
- **理由**：避免误把技术选型当作趣味性的充分条件。

---

## 三、产品方向

### ADR-002 国际化为第一公民

- **状态**：✅ ACCEPTED
- **决策**：默认简体中文，完整支持英文，架构预留多语言扩展。所有面向用户文本走统一 i18n 资源体系，禁止硬编码任何语言字符串。教学内容中/英双份，公式语言无关。
- **影响**：所有 UI/教学/求解器步骤解释/错误/成就名均需 i18n key。

### ADR-003 游戏性第一 / 教育内容渐进式揭示

- **状态**：✅ ACCEPTED
- **决策**：纯娱乐手感最高优先级；教育内容默认折叠，经非侵入入口按需展开；统一渐进式揭示组件贯穿所有游戏。任何侵入 L1 手感的教育设计一律否决。

### ADR-004 首个垂直切片选 Lights Out（点灯）

- **状态**：✅ ACCEPTED
- **决策**：阶段 4 用 Lights Out 打通端到端样板。
- **理由**：规则极简、数学优雅（GF(2) 高斯消元/零空间）、求解器与唯一解/最优生成器可控、适合验证三层体验 + 跨端全链路 + 中英双语 + 算法可视化。

---

## 四、已决策（工具链 / 技术选型）

### ADR-005 跨端框架选型（Taro vs uni-app）

- **状态**：❌ NOT ADOPTED（未采用；选定 React + Tauri + Capacitor，见 ADR-010）

### ADR-006 Monorepo 工具链

- **状态**：⚠️ SUPERSEDED（包清单已被 ADR-023 取代）
- **原决策**：pnpm workspaces。包划分：`packages/core` / `packages/games` / `packages/education` / `packages/i18n` / `packages/ui` / `packages/viz` / `apps/web` / `apps/desktop` / `apps/mobile`。
- **现包结构（ADR-023）**：`packages/core` / `packages/games` / `packages/education` / `packages/ui` / `apps/web`。i18n 字符串归入各游戏目录，viz 组件在 web 层按 trace.type 懒加载（`packages/i18n`、`packages/viz` 已移除）。
- **确认日期**：2026-06-25（阶段 0）；2026-06-27 被 ADR-023 取代。

### ADR-007 数学公式渲染方案（KaTeX vs MathJax）

- **状态**：✅ ACCEPTED
- **决策**：KaTeX（快、体积小 ~280KB、子集支持）。若后续某个游戏超出 KaTeX 能力，可针对那一个模块引入 MathJax 按需加载。
- **理由**：Web 首屏体积敏感，Ludus 教学内容主要是行内公式和简单块公式（复杂度类、递推式、矩阵等），KaTeX 子集已足够。MathJax 完整能力溢出需求。
- **确认日期**：2026-06-25（阶段 0 确认）。

### ADR-008 状态/关卡/教学内容的序列化 schema 与版本化策略

- **状态**：✅ ACCEPTED
- **决策**：TypeScript 类型 + zod 运行时校验 + semver 版本号。数据 `version` 字段声明版本，Core 层提供 migrator（version N → N+1）。
- **理由**：全栈 TS，JSON 自然序列化格式，无跨语言需求；zod 同时提供 TS 类型推导和运行时校验；关卡文件小巧，JSON 可读性好利于调试和导入导出。Protobuf/Avro 对当前规模过度设计。
- **确认日期**：2026-06-25（阶段 0 确认）。

### ADR-013 i18n 库选型

- **状态**：✅ ACCEPTED
- **决策**：react-i18next。ICU MessageFormat 支持（复数/性别/选择），生态最成熟、文档最好。
- **确认日期**：2026-06-25（阶段 0 确认，对应 Q4）。

### ADR-014 测试框架

- **状态**：✅ ACCEPTED
- **决策**：Vitest（快、Vite 原生、Jest 兼容 API、原生 ESM）。
- **确认日期**：2026-06-25（阶段 0 确认，对应 Q5）。

### ADR-015 MVP 范围

- **状态**：✅ ACCEPTED
- **决策**：标准 MVP = 3 款游戏：① Lights Out 点灯（线性代数 GF(2)）② 数独（CSP/SAT，DLX）③ Nim/Wythoff（组合博弈论）。分别覆盖三个不同领域，充分暴露插件接口缺陷。
- **确认日期**：2026-06-25（阶段 0 确认，对应 Q7）。

### ADR-016 开源许可证

- **状态**：✅ ACCEPTED
- **决策**：MIT（宽松许可证，最大化传播与复用）。
- **确认日期**：2026-06-25（阶段 0 确认，对应 Q8）。

### ADR-017 关卡数据存储

- **状态**：✅ ACCEPTED
- **决策**：文件导入导出为主 + localStorage 缓存最近进度。IndexedDB 留作将来大量用户生成内容时的升级路径。
- **确认日期**：2026-06-25（阶段 0 确认，对应 Q6）。

### ADR-018 UI 设计系统：Playful Bento

- **状态**：✅ ACCEPTED
- **决策**：采用 Bento Box 风格适配版（"Playful Bento"）。Hub 层纯 Bento 网格；Game Shell 层保留 Bento 视觉语言但棋盘区全出血；教育层 Bento 知识卡。颜色体系 Warm Stone + Logic Indigo + Game Amber + Clarity Teal。圆角分层（6–24px）。玻璃效果仅 Hub 层。
- **理由**：Bento Box 的模块卡片网格天然映射到游戏合集浏览 + 渐进式揭示的空间隐喻；适配改造解决了纯 Apple Bento"卡框约束游戏手感"的缺陷。
- **影响**：`packages/ui` 组件库按此设计系统实现（阶段 4 先在 `apps/web/src/components/` 内实现，阶段 5+ 提取到 `packages/ui`）；每游戏入口卡可声明专属强调色；动效与间距按统一规范。
- **确认日期**：2026-06-26。
- **详细文档**：`docs/phases/04-ui-design-system.md`

### ADR-019 状态管理：Zustand

- **状态**：✅ ACCEPTED
- **决策**：React 层状态管理使用 **Zustand**。Core 层保持框架无关的纯 TS 状态对象；Zustand store 包裹 Core 状态并通过 actions 委托到 Core 纯函数。
- **理由**：
  - 体积极小（~2KB gzip），零 boilerplate，不需要 Provider 包裹
  - 天然支持 subscribe/selector 模式，适合高频更新的游戏棋盘
  - middleware 生态成熟：immer（不可变更新）、persist（localStorage 进度）、devtools
  - 与 Core 层边界清晰：`store.gameState` 持有 Core 的 `GameState` 实例，`store.applyMove()` 调用 Core 的 `applyMove()` 后更新引用
- **对比淘汰**：
  - React Context + useReducer：模板代码多、性能需手动 memo/selector、跨组件树传递麻烦
  - Jotai：原子化粒度对游戏状态过细（一个棋盘状态是整体，不需要每个单元格一个 atom）
  - Redux Toolkit：体量过大、对游戏类应用过度设计
- **Store 设计原则**：
  1. 每个游戏实例一个 store（或全局单 store 按 `gameId` 分区）
  2. Store 字段：`gameState`（Core 类型）、`history: GameState[]`、`historyIndex`、`disclosureLevel: 1|2|3`、`language`
  3. Actions 全部委托 Core 纯函数，store 只做状态引用切换
  4. 求解器调用走 Web Worker，store 持有 `solverStatus: 'idle' | 'running' | 'done'`
- **确认日期**：2026-06-26。

### ADR-020 路由：React Router v6

- **状态**：✅ ACCEPTED
- **决策**：使用 **React Router v6**（`createBrowserRouter`）。路由结构：
  - `/` — Hub 首页（游戏合集）
  - `/game/:gameId` — 游戏视图（关卡选择 + 游戏棋盘）
  - ~~`/game/:gameId/level/:levelId`~~ — 关卡直链（v0.1 未实现，已移除路由；Sokoban 关卡在 toolbar 内选择）
  - 未来：`/stats`、`/settings`
- **理由**：
  - 生态最成熟、文档最全、社区问题最少
  - Tauri（WebView）和 Capacitor（WebView）均无兼容问题
  - v6 的 `createBrowserRouter` + `loader` 模式足够，不需要 v7 的 Remix 式 SSR（我们是纯 CSR SPA）
  - TanStack Router 类型安全更好但生态太新、学习成本高，对游戏应用的收益有限
- **影响**：`apps/web/src/router.tsx` 定义路由树；GameShell 通过 `useParams()` 获取 `gameId`，动态加载对应游戏模块
- **确认日期**：2026-06-26。

### ADR-021 音效策略：Howler.js + 阶段 4 做基础音效

- **状态**：✅ ACCEPTED
- **决策**：
  1. 音效库选 **Howler.js**（~7KB gzip，Web Audio API 封装，audio sprite 支持，移动端兼容好）
  2. **阶段 4 即加入基础音效**，不推迟。这是手感反馈的必要组成部分（见 DoD 与 ADR-012），不是可选装饰
- **阶段 4 音效范围（最小集）**：
  - UI 音效：按钮点击（~2KB）、错误提示（~2KB）
  - 游戏音效：操作走子（每个游戏可自定义，~3KB）、撤销（~2KB）、胜利（~5KB）
  - 总计 < 20KB，用 audio sprite 合并为单文件减少请求
- **理由**：静默的交互会严重拉低"可玩"的体感质量，即使视觉到位。Claude Code 的 DoD 明确要求"基础手感反馈与美术打磨"。先用最小集验证手感，后续游戏递增时再扩展音效库
- **影响**：`apps/web/src/hooks/useSound.ts` 封装 Howler；每个游戏模块可声明 `soundManifest`
- **确认日期**：2026-06-26。

### ADR-022 阶段 4 启动边界：最小包启动

- **状态**：✅ ACCEPTED
- **决策**：阶段 4 只创建和实现 **3 个必需包**，而非一次性搭建全部 9 个包：
  - `packages/core` — 已有类型/schema，追加 GF(2) 求解器 + 生成器 + Worker 抽象
  - `packages/games` — Lights Out 插件（rules/solver/generator/manifest/render）
  - `apps/web` — Vite + React + Router + i18n 骨架 + 路由 `/game/lights-out`
- **暂不创建**（等阶段 5/6 需要时再建）：
  - `packages/ui` — 阶段 4 的 GameShell/Button 等组件先放在 `apps/web/src/components/`，等 ≥2 款游戏共享时提取
  - `packages/viz` — 算法可视化在阶段 5 才需要
  - `packages/education` — 阶段 3 已有 Lights Out 教学内容文件；apps/web 通过 entrySetup.tsx 的 Vite ?raw import 直接消费其内容文件
  - `packages/i18n` — 阶段 4 的语言资源放在 `apps/web/src/i18n/`，等规模到需独立管理时再提取
  - `apps/desktop` / `apps/mobile` — 阶段 6
- **理由**：垂直切片的目的是**最快验证全链路**，不是搭建完整 monorepo。一次性创建全部包会分散注意力且大量包长时间为空。等模式在 ≥2 款游戏中验证后提取共享代码，反而能设计出更准确的接口
- **提取判断标准**：同一个模块被 ≥2 个 package import → 提取到对应共享包
- **确认日期**：2026-06-26。

---

## 五、游戏模块决策

### ADR-024 围堵小偷 v1.1：大地图、混合可胜保证与对抗 AI

- **状态**：✅ ACCEPTED
- **决策**：
  1. 围堵小偷地图按难度扩展为 **11 / 15 / 19** 三档，替代 v1 的 7 / 9 / 11。
  2. 关卡生成采用混合可胜保证：简单 11×11 必须通过 `copHasWinningStrategy` 搜索验证；中等/困难采用瓶颈构造 + 浅层对抗抽检，明确不声称全局数学证明。
  3. 小偷 AI 从纯 BFS 贪心升级为对抗搜索优先：Worker 中运行有限预算 minimax/alpha-beta；超时标记 `bounded`；不可用或无合法对抗步时降级到 BFS 贪心。
- **理由**：v1 地图偏小且小偷只跟随当前最短路，玩家容易通过局部堵路获胜。v1.1 用更大地图和未来回合视角增强围堵手感，同时保留 BFS 逃脱路径作为可解释教学核心。
- **影响**：`packages/games/src/thief-siege/adversary.ts` 成为对抗搜索核心；`generator.ts` 调用同一引擎做 easy 证明和 mid/hard 抽检；Web 通过 `ai-move` Worker 避免大图搜索阻塞 UI；教育文档必须诚实区分“已证明”和“构造+抽检”。
- **风险**：中/难关没有全树证明，极端 seed 仍可能被更强搜索打穿；后续可用 seed 回归修生成器，或新增 AND-OR / 主变例树可视化。
- **确认日期**：2026-07-11。

### ADR-025 孔明棋：复用 search-tree trace 与诚实搜索证据面板

- **状态**：✅ ACCEPTED
- **决策**：
  1. 孔明棋继续复用 `SolverTrace.type = 'search-tree'`，不新增 `peg-search` union 成员。
  2. Web 层使用 `PegSearchViz` 作为“搜索证据面板”：展示探索节点、解长、耗时、最大深度、终止原因、D4 对称与返回路径；不伪装成完整搜索树证明。
  3. 教学与文档必须明确区分 BFS 最短性、DFS 可达性、Worker 离线程执行、生成器可达验证、以及 `uniqueSolution: false` 的边界。
- **理由**：现有 Sokoban/ Peg solver 都能表达为 `search-tree`，复用 trace contract 可减少 core 类型膨胀；孔明棋 v1 的 trace 目前没有完整 parent/child tree 样本，证据面板比“看似完整”的树图更诚实。
- **影响**：`apps/web/src/entrySetup.tsx` 仅在 `peg-solitaire` entry 上把 `search-tree` 绑定到 `PegSearchViz`，避免与 Sokoban 的 `BFSTreeViz` 冲突；后续若 solver 输出完整节点关系，可在不改 core trace type 的前提下升级为 React Flow 树。
- **风险**：当前可视化解释力度强于交互探索力度；若未来需要逐节点展开或对称轨道动画，需要扩展 `visualizationData` schema。
- **确认日期**：2026-07-14。

---

## 📝 决策日志

- ADR-001/002/003/004/009/010/011/012 录入（项目立项阶段）。
- [2026-06-25] 阶段 0 确认：ADR-006(pnpm) / ADR-007(KaTeX) / ADR-008(zod+semver) / ADR-013(react-i18next) / ADR-014(Vitest) / ADR-015(MVP 3 款) / ADR-016(MIT) / ADR-017(文件+localStorage) → ACCEPTED。
- [2026-06-26] ADR-018 (Playful Bento UI 设计系统) → ACCEPTED。详见 `docs/phases/04-ui-design-system.md`。
- [2026-06-26] ADR-019 (Zustand 状态管理) / ADR-020 (React Router v6) / ADR-021 (Howler.js 音效 + 阶段 4 即做) / ADR-022 (阶段 4 最小包启动) → ACCEPTED。
- [2026-06-27] ADR-023 (游戏即插件 — 全自包含架构) → ACCEPTED。
  - **决策**：每款游戏 = `packages/games/<game>/` 下完全自包含的目录，含 types/rules/solver/generator/difficulty/render/manifest/i18n。Core 只保留类型/schema/Worker 抽象（不留任何游戏专属策略代码）。共享布局提取到 `packages/ui`。
  - **理由**：当前 5 款游戏后 core 膨胀至 41 文件、GameShell 418 行上帝组件、gameStore 硬编码 Nim/Wythoff AI。新增第 6 款游戏摩擦成本递增。162 款游戏 backlog 需要可缩放架构。
  - **新增接口**：`GamePluginEntry`（`packages/games/src/types.ts`）— 包装 `GamePlugin` + BoardComponent + isOwnState + i18n + ui 扩展 + education + visualization
  - **新增字段**：`GamePlugin.ai?: { isAITurn, getAIMove }`（对抗游戏 AI 对手的通用抽象）
  - **迁移计划**：10 步，全部完成。详见各阶段 commit 记录。最终包结构：core/games/education/ui 4 包 + apps/web。i18n/viz 包已移除。
- [2026-07-11] ADR-024 (围堵小偷 v1.1：大地图、混合可胜保证与对抗 AI) → ACCEPTED。
- [2026-07-14] ADR-025 (孔明棋：复用 search-tree trace 与诚实搜索证据面板) → ACCEPTED。

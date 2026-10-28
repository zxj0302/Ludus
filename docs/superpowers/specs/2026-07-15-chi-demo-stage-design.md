# CHI Demo Stage Layout — 设计 Spec

> 状态：**已实现（待展台走查）**  
> 日期：2026-07-15  
> 关联：`docs/superpowers/specs/2026-07-15-chi-demo-mode-design.md`（父 spec；**§4 UI 线框由本文覆盖**）、`docs/publishing/chi-demo-roadmap.md`、`docs/superpowers/plans/2026-07-15-chi-demo-stage.md`  
> 范围：**仅 `/demo`**；普通 Hub / GameShell 侧栏 EducationPanel **不改**  
> 路线图定位：补齐 **C1 体验缺口** + 提前兑现 **C2「viz 强调」** 中 Demo 侧部分（非整站 polish / 离线包仍属 C2）

## 0. 与计划/目标的对齐结论（审阅）

| 来源 | 要求 | 本 spec | 判定 |
|------|------|---------|------|
| Roadmap 贡献主张 | 同实例：手感→形式化→求解器+viz（生成另论） | 左玩右看 live solver；形式化靠旁白一句 | ✅ 展台核心路径对齐；**生成未进三幕**（既有缺口，非本文引入） |
| Roadmap 成功标准 #1 | 3 分钟内完成「玩→提示/求解→看见算法」 | 分屏使「看见算法」可见；软门槛保留 | ✅；须配合短回放种子（见 §8） |
| Roadmap 成功标准 #2 | 视频能懂 progressive disclosure + live solver | chrome 旁白=L2 钩子；Stage R=live solver；全文在 Hub | ✅ 需在旁白/论文中说清，避免被看成「只有 viz」 |
| ADR-003 | 教育不侵入 L1 | play/hint 不展开文档墙；solve 才开第二舞台 | ✅ |
| 父 Demo Mode §4 | 教育全文不自动展开；reveal 开 L2 摘要或高亮 viz | 摘要=顶栏旁白；viz=Stage R；无 Markdown | ✅ **细化并覆盖**父 §4 线框 |
| 父 Demo Mode 控制 | Next / Skip to viz / Exit | 现有 Next + Skip play；缺「Skip to viz」 | ⚠️ 见 §6.1 补最小项 |
| C2 checklist | 触控、离线、英默认 | 英默认已有；触控/离线 **不在本文** | ✅ 边界清楚 |
| Playful Bento P1 | 棋盘视觉主角 | L 55–60%；play 时 R 全收 | ✅ |

**审阅修订要点**（相对初稿）：明确覆盖父 §4；play 时 Stage R **完全收起**（不做弱占位条）；澄清 progressive disclosure 在 Demo 的映射；`reveal.depth` 语义；补 Skip-to-viz；收紧 Stage R 内容上限；验收挂钩回放时长。

---

## 1. 背景与问题

当前 Demo 复用 `GameShell` + `EducationPanel`：教学 Markdown、StatusCard、算法 Viz、步骤列表全部挤在侧栏。展台叙事上像「打开文档」，不像「算法在第二舞台发生」，与 Playful Bento「棋盘永远是主角」及 CHI 贡献点（live solver + progressive disclosure）不对齐。

用户确认（2026-07-15）：

1. 范围：**A — 只改 CHI `/demo`**  
2. 呈现：**舞台化**（棋盘旁大块 live viz）  
3. 布局：**左右分屏（方案 A）**

## 2. 目标与非目标

### 目标

- `solve` / `reveal` 时，算法可视化是与棋盘并排的 **Stage R（第二舞台）**，讲解员可指「左玩 · 右看」。  
- 顶栏旁白 + 进度是 Demo 内**唯一**叙事文案源；**不**自动展开五段式 Markdown。  
- 保留已落地的 beat 软门槛（play / skip、hint·solve 锁 Next）。  
- 让 walkthrough 视频在不看侧栏的情况下仍能拍到「棋盘 + 算法图」同框。

### Demo 上的渐进式揭示（对齐论文话术）

| 层 | Demo 中的落点 |
|----|----------------|
| L1 | Stage L 棋盘 + play/hint；无文档 |
| L2 | 顶栏旁白一句 + Stage R live viz / 状态 |
| L3 | **不在 Demo 内展开**；可选「在合集中阅读」→ `/game/:id`（自愿） |

这不是削弱 progressive disclosure，而是展台版：**钩子在场，全文按需离场**。

### 非目标

- 不重构整站 GameShell / EducationPanel 默认布局。  
- 不做「焦点切换」（棋盘缩角、viz 占满主舞台）。  
- 不新增求解器；继续 `requestHint` / `requestSolve` 与 `entry.visualization`。  
- 不做离线 release、大触控全面改造、走廊评估（C2/C3）。  
- 不把「关卡生成」塞进本三幕（论文差异点保留在系统能力/Hub；Demo 视频以 solver+viz 为主）。  
- 不把本改动当作 Steam 序章 UI。

## 3. 布局

### 3.1 Desktop（`lg+`）

```
┌─ Demo chrome：标题 · Act/Beat 进度 · 旁白 · Prev/Next/Skip/Exit ─┐
├────────────────────────────┬────────────────────────────────────┤
│  Stage L — Board           │  Stage R — Live Viz                 │
│  精简壳（Board + 必要状态） │  主：visualization.Component         │
│  无 Education 侧栏抽屉      │  次：短步骤列表；StatusCard 按需     │
└────────────────────────────┴────────────────────────────────────┘
```

比例：Stage L ≈ 55–60%，Stage R ≈ 40–45%（仅 `solve`/`reveal` 展开时）。

**覆盖声明**：父 spec `2026-07-15-chi-demo-mode-design.md` §4 单栏线框，以实现时以**本布局为准**。

### 3.2 按 beat 的舞台状态

| Beat | Stage L | Stage R |
|------|---------|---------|
| `speak` | 为主 | **完全收起**（不渲染占位条，避免抢 L1） |
| `play` | 为主，可交互 | **完全收起** |
| `hint` | 为主，高亮在棋盘 | **完全收起** |
| `solve` | 回放棋盘 | **展开**；挂载 live viz，随 `solveStepIndex` 更新 |
| `reveal` | 轻交互或只读均可 | **保持展开**；原理只在顶栏旁白 |

### 3.3 Narrow（`< lg`）

上下栈：上 L、下 R（仅应展开时挂载）。展台主目标仍是横屏笔记本；窄屏为降级。

## 4. 内容分工

| 区域 | 包含 | 排除 |
|------|------|------|
| Demo chrome | 旁白、进度、Prev/Next、Skip play、**Skip to viz**（§6.1）、Exit、门控等待提示 | 五段 Markdown |
| Stage L | Board、精简 status（步数/回放）、弱化 toolbar | 教育侧栏开关、高级 Generator、展台可藏 New Level |
| Stage R | **主**：`entry.visualization.Component`（无 trace 时显示简短「求解中/无可视化」态）；**次**：≤8 步可见的最优步列表；StatusCard **仅当**不与棋盘信息严重重复时 | L2/L3 Markdown；默认无「展开教学」按钮 |

`reveal.depth`（playlist 上的 `L2`/`L3`）：**v1 不驱动 UI 切深度**（Demo 无全文）。字段保留以兼容 schema；旁白 key 自行承担 L2 密度。日后若要在 Stage R 显示一张 KnowledgeCard 摘要，再启用 depth。

## 5. 组件与数据流

### 5.1 结构

```
DemoPage
  ├─ DemoChrome
  └─ DemoStage
       ├─ DemoBoardPane   // GameShell variant="demo" 或等价
       └─ DemoVizPane     // beat ∈ {solve,reveal} 时挂载
```

- **推荐**：`GameShell` `variant="demo"`：强制不渲染教育侧栏与侧栏开关；可隐藏 Generator/New Level。音效、undo、回放逻辑复用。  
- **备选**：完全自拼 Board（重复成本高，不优先）。

### 5.2 `variant="demo"` 必须隐藏的 UI

- Education 侧栏 + 侧栏开关按钮  
- 打开 EducationPanel 的任何默认副作用  
- 高级生成器入口（若 toolbar 暴露）  
- 建议隐藏：New Level（固定种子剧本不应换关）

不隐藏：Undo/Reset（play 需要）、Solve/Hint（可保留但 beat 已驱动，按钮可降视觉权重）。

### 5.3 Store

- Demo 路径 **不再** 用 `setEducationOpen(true)` / `educationPreferViz` 作为主展示。  
- Stage R 开闭：**由当前 `beat.type` 推导**（`solve` | `reveal` → open），v1 不必新 store 字段，也不改 playlist schema。

### 5.4 Playlist schema

v1 **不改** zod。三幕仍为 Lights Out → Nim → Sokoban。

## 6. 与现有 beat 门控的关系

保持 `demoAdvanceGate`：

- `play`：一步或 Skip play  
- `hint`：armed 且 solver 非 running  
- `solve`：armed、非 running、且 `!solvePlayback`  
- `solve` 进入：`requestSolve` + Stage R 展开（**替代**开 EducationPanel）

### 6.1 Skip to viz（对齐父 spec 控制表）

在 `speak` / `play` / `hint` 提供次要操作 **「Skip to viz」**：跳到**本幕**第一个 `solve` beat（若无则第一个 `reveal`）。  
- 不跳幕；不跳过整场 Demo。  
- 与「Skip play」区分：后者只满足 play 门控，前者快进到算法舞台。

## 7. i18n

新增（中英）：

- `demo.stage.vizTitle`  
- `demo.stage.skipToViz`  
- `demo.stage.readInHub`（可选外链）  
- `demo.stage.vizEmpty`（无 trace 时）

**删除初稿** `demo.stage.vizPending`（play 阶段不再做弱占位条）。

旁白建议（可同 PR 微调）：`solve`/`reveal` 文案点明「看右侧 / see the panel on the right」。

## 8. 验收标准

1. `/demo` 在 `speak`/`play`/`hint`：**无**教育侧栏、**无** Stage R、**无** Markdown 墙；棋盘为视觉主角。  
2. 进入 `solve` 后 Stage R 出现；三幕在「该游戏确有 viz」前提下，右舞台可见对应可视化（Lights Out 矩阵 / Nim 树或 XOR 卡 / Sokoban BFS 树）。  
3. `reveal` 不展开 Markdown；顶栏旁白承担原理一句。  
4. `demoAdvanceGate` + act 切换 `beatIndex` 重置回归通过。  
5. `/game/:id` 侧栏行为无回归。  
6. **展台时长**：单幕「play(可 skip)→hint→solve 回放完」在固定种子下建议 **≤90s**（服务 Roadmap 3 分钟至少一幕）；超长则调 seed / 缩短回放，属实现走查项，不阻塞本布局落地。  
7. 「Skip to viz」可从 play 跳到本幕 solve。

## 9. 实现顺序（建议）

1. `GameShell` `variant="demo"`（隐藏清单见 §5.2）。  
2. `DemoVizPane`（抽/复用 EducationPanel live-analysis，去掉 Markdown）。  
3. `DemoPage` 左右分屏 + 按 beat 开关 Stage R；移除开 EducationPanel 副作用。  
4. Skip to viz + i18n。  
5. 三幕走查：viz 可见性、回放时长、窄屏栈。

## 10. 确认记录

| 项 | 结论 |
|----|------|
| 范围 | 仅 `/demo` |
| 隐喻 | 舞台化 |
| 布局 | 左右分屏（窄屏上下）；覆盖父 §4 线框 |
| 教学正文 | Demo 内不出现；L3 仅可选 Hub 外链 |
| Stage R 在 play | 完全收起 |
| Skip to viz | 本幕快进到 solve/reveal |
| 用户口头 OK 初稿 | 2026-07-15 |
| 审阅修订 | 2026-07-15（本文件 §0） |

用户终确认本修订稿后 → 实现计划 `docs/superpowers/plans/2026-07-15-chi-demo-stage.md` → **已落地**（`GameShell variant="demo"`、`DemoVizPane`、分屏 + Skip to viz）。

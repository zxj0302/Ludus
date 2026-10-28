# CHI Demo Mode — 设计 Spec

> 状态：**C1 进行中**（用户已确认推荐三幕；schema + `/demo` 已落地）  
> 日期：2026-07-15  
> 关联：`docs/publishing/chi-demo-roadmap.md`  
> 前置：Hub 已有 13 款可玩游戏 + 五段式教育 + viz

## 1. 目标

在 **不破坏 L1 手感** 的前提下，提供一条 **编导过的 3 幕体验**，供 CHI Interactive Demo 展台与 walkthrough 视频使用。

默认入口：`/demo` 或 `/?demo=1`（英默认 locale）。  
普通 Hub `/` 行为不变。

## 2. 已倾向决策（请确认）

| 项 | 推荐 | 备选 |
|----|------|------|
| **三幕游戏** | Lights Out → Nim → Sokoban（Microban 极小关） | 第 2 幕改 Kayles；第 3 幕改 Sudoku |
| **入口** | React Router `/demo` + 查询参数续播 `?act=2` | 仅 `?demo=1` 覆盖 Hub |
| **数据** | 版本化 JSON playlist（zod 校验）放 `apps/web/public/demo/` 或 `src/demo/` | 新包 `packages/campaign`（本阶段不做，免扩 ADR） |
| **旁白** | 每步 i18n key + 可选 1 句英文主导 | 硬编码英文字符串（禁止） |
| **控制** | 「Next beat」「Skip to viz」「Exit demo」 | 自动计时翻页（易扰人，v1 不做） |
| **关卡** | 每幕 `seed` / 内嵌 `initialState` 固定 | 每次随机（Demo 禁止） |
| **语言** | Demo 默认 `en`，可切回 zh-CN | 跟随系统 |

## 3. Playlist 数据模型（草案）

```ts
// schemaVersion: 1
interface DemoPlaylist {
  schemaVersion: 1;
  id: string;                 // 'chi-2026-core'
  titleKey: string;           // i18n
  defaultLocale: 'en' | 'zh-CN';
  acts: DemoAct[];
}

interface DemoAct {
  id: string;                 // 'lights-out'
  gameId: string;             // registry id
  titleKey: string;
  /** Fixed level — prefer seed + generateLevel, or inline initialState */
  level: { seed: number; difficultyRange?: [number, number] }
        | { initialState: Record<string, unknown> };
  beats: DemoBeat[];
}

type DemoBeat =
  | { type: 'play';    narrationKey: string; durationHintSec?: number }
  | { type: 'hint';    narrationKey: string }
  | { type: 'solve';   narrationKey: string }   // start solve / show viz
  | { type: 'reveal';  narrationKey: string; depth: 'L2' | 'L3' }
  | { type: 'speak';   narrationKey: string };  // narration only, no action
```

校验：zod schema 放 `packages/core/src/schemas/demo-playlist.ts`（纯数据契约，符合 Core 职责）。

## 4. UI / UX

```
┌─────────────────────────────────────────────┐
│  Ludus Demo · Act 2/3 · Nim                 │
│  [=======●--------] beat 2/4                │
├─────────────────────────────────────────────┤
│  Narration (EN): "Try a move… then Hint"    │
│                                             │
│         ┌─────────── Board ───────────┐     │
│         │                             │     │
│         └─────────────────────────────┘     │
│                                             │
│  [ Hint ]  [ Show solver ]  [ Next → ]      │
│  Exit to Hub                                │
└─────────────────────────────────────────────┘
```

约束：

- 教育全文 **不** 自动展开；`reveal` beat 只打开 L2 摘要或高亮 viz。  
- `solve` beat 调用现有 store solve/hint，不新造求解器。  
- 展台模式：隐藏进阶生成器、减少设置噪音。

## 5. 实现顺序（C1）

1. **Task 1** — zod schema + `chi-core.json` playlist + unit tests  
2. **Task 2** — `DemoShell` 路由 `/demo`：读 playlist、显示旁白与 Next  
3. **Task 3** — 接 `loadState` / hint / solve / locale=en  
4. **Task 4** — 三幕真实种子打磨 + 英旁白 i18n  
5. **Task 5** — 离线 build 验证 + `docs/publishing/chi-submission` 素材目录占位  

## 6. 与 Steam 的边界

Demo playlist **可复用**为将来 Steam「序章」；本阶段不写成就/每日挑战/Steamworks。

## 7. 确认记录

用户已确认（2026-07-15）：

1. 三幕：**Lights Out → Nim → Sokoban**  
2. 入口：**`/demo`**  
3. 第 2 幕：**Nim**（非 Kayles）  

C1 进度：Task 1–2 ✅（schema + playlist + DemoPage）；下一步 Task 3–4 打磨种子与 beat 副作用稳定性。

# Connect Four（四子棋）设计 Spec — v1.0

> 状态：**已确认方向**（用户选定 backlog 早期顺序 #4）  
> 日期：2026-07-14  
> 关联：Nim/Wythoff 对抗模式；Allis 1988 强解（教学引用，v1 不实现全盘强解库）

## 1. 目标

标准 **6×7** 四子棋：L1 落子手感优先；L2/L3 揭示 Minimax / Alpha-Beta 与博弈树；人机对战 + 求解演示 + 残局生成。

## 2. 已确认决策

| 项 | 结论 |
|----|------|
| 棋盘 | 6 行 × 7 列，重力落子 |
| 对战 | 玩家 vs AI（对齐 Nim：选先后手 → `phase: choosing`） |
| 走子 | `{ column: 0..6 }`，仅未满列 |
| 终局 | 四连（横/竖/斜）或满盘和棋 |
| 求解器 | Alpha-Beta（深度可配）；Worker 深搜；诚实 timeout |
| 生成器 | 空盘或随机对弈残局（seed 可复现） |
| 可视化 | React Flow 博弈树（`search-tree` trace） |
| Hub id | `connect-four` |

## 3. 状态模型

```ts
interface ConnectFourState {
  board: number[][]; // 0 empty, 1 = player disc, 2 = AI disc
  currentPlayer: 0 | 1;
  phase: 'choosing' | 'playing';
  winner: 0 | 1 | 'draw' | null;
  lastColumn?: number;
}
```

## 4. DoD（v1）

- [ ] Core：rules + alpha-beta solver + generator + difficulty + 单元测试
- [ ] Game：plugin/entry/render/i18n/manifest/education-ui + registry
- [ ] Web：entrySetup + ConnectFourTreeViz + i18n keys
- [ ] Education：L2/L3 × zh-CN/en 四份
- [ ] `load-smoke` 注册通过；`pnpm test:run` / `typecheck` / `build` 绿

## 5. 非目标（v1）

- 全盘 4.5T 强解开局库（Allis）
- 在线对战 / 多人
- Canvas 渲染（DOM + Framer Motion 足够）

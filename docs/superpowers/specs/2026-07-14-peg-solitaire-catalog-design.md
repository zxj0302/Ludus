# 孔明棋（Peg Solitaire）设计 Spec — v1.2 模式+选关

> 状态：**已确认方向**（用户：取消难度分类；对齐推箱子——直接选关 + 模式「剩一 / 中心剩一」）  
> 日期：2026-07-14（v1.1 合集 → v1.2 UX）  
> 关联：原 dig 稿 `docs/superpowers/specs/2026-07-14-peg-solitaire-design.md`（历史）；**以本文件为准**

## 1. 变更动机

v1.1 用 Hub 简单/中等/困难映射合集分层（方案 A）。用户反馈：**不要再对难度分类**；应像推箱子一样直接选关，并用模式区分「剩一」与「中心剩一」。

## 2. 已确认决策（v1.2）

| 项 | 结论 |
|----|------|
| 棋盘 | 英国十字 **33 孔**（不变） |
| 通关目标（游玩） | 仅两种：`one-any` · `one-center` |
| **移除** | Hub **难度选择**；难度档抽题；游玩 `le3`；程序化生成 |
| 关卡 | **经典著名局面合集**（curated catalog） |
| **主 UX** | **模式**（剩一 / 中心剩一）+ **名局列表**（对齐 `SokobanToolbar` / `LevelSelector`） |
| `generateLevel` | 仅 Hub 首载回退：默认 `one-center` 合集（seed 0 → classic） |
| 求解器 / Worker / React Flow | 保持 |
| 教学 | 必须讨论两种目标差异；出题段改为「选模式/选名局」 |

## 3. 状态模型（游玩）

```ts
type PegGoal = 'one-any' | 'one-center';

interface PegSolitaireState {
  pegs: number;
  goal: PegGoal;
  status: 'playing' | 'won' | 'stuck';
  catalogId?: string;
}
```

| goal | 获胜条件 |
|------|----------|
| `one-any` | `popcount === 1` |
| `one-center` | `popcount === 1` 且中心孔有子 |

## 4. UI 映射（对齐推箱子）

| 推箱子 | 孔明棋 |
|--------|--------|
| 合集（Microban / …） | 模式：剩一 / 中心剩一 |
| 关卡序号 | 名局列表（`titleKey` i18n） |
| 无难度滑杆 | 无难度滑杆 |

实现：`apps/web/src/components/PegSolitaireToolbar.tsx` → `LevelSelector`。

## 5. 关卡合集（catalog）

合约同 v1.1：`id` / `titleKey` / `source` / `pegs` / `goal` / `knownSolutionLength`；`tier` 可保留为遗留元数据，**UI 不再使用**。

浏览 API：`catalogByGoal(goal)`；`one-center` 列表将 classic 置顶。

## 6. 难度分

`getDifficulty` 仍可产出 0–100 元数据供摘要；**不驱动 Hub 选关 UI**。

## 7. 教学

出题段：模式 + 名局选关；删除「按简单/中等/困难抽题」表述。

## 8. DoD（v1.2）

- [x] 取消 peg 的 `GeneratorToolbar` / 难度选择
- [x] `PegSolitaireToolbar`：模式 + 名局
- [x] `generateLevel` 降级为 Hub 回退
- [x] 教学 / 开发者文档 / ADR 同步
- [x] 单测更新

## 9. 非目标

- 程序化关卡生成
- `le3` 可玩目标
- 法式 / 三角盘
- 重新引入 Hub 难度三档选关

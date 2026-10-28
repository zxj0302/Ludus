# Lights Out Bidirectional Viz — 设计 Spec

> 状态：**已实现**  
> 日期：2026-07-15  
> 关联：`docs/superpowers/specs/2026-07-15-chi-demo-stage-design.md`、CHI Demo Act 1  
> 范围：仅 **Lights Out**；证明「viz 反控棋盘」比并排旁观更有趣

## 1. 问题

Stage R 的 MatrixViz 与棋盘同框但仍是旁观：连接弱，像缝合功能。用户选择先做 **A：LO 双向样板**。

## 2. 交互

**Solution 视图**中解向量格子（`solution[i] === 1`）可点击：

| 点击 | 效果 |
|------|------|
| `●`（应按且未在「相对初始的奇偶」上完成） | `applyMove({ row, col })` |
| 已按过的格（GF(2) 再点） | 再次 `applyMove`（撤销该按） |
| `·`（解为 0） | 不可点 |
| `solvePlayback === true` | 全部禁用 |

矩阵 / 消元 / 统计 tab：v1 只读。

## 3. 实现要点

- `MatrixViz` 增加可选 `onPressCell` + `solvePlayback`；有回调且非 playback、棋盘未清空时，`●`/`✓` 为可点 button。  
- `entrySetup` 中 `LightsOutMatrixViz` 接入 `applyMove`。  
- Demo `reveal`：**reset** 回本幕初始关并保留解，以便回放通关后仍可用右侧反控。  
- Demo 旁白：点右侧解格 = 下棋。  
- Hub 与 Demo 共用可点行为。

## 4. 非目标

- 消元步骤 / 完整 A 矩阵反控（v2）  
- Nim / Sokoban 双向  
- 通用 `onVizInteract` 框架（样板后再抽）

## 5. 验收

1. Demo LO `solve`/`reveal`：点解向量 `●` → 棋盘灯翻转。  
2. 再点同一格 → 翻转回来。  
3. 回放中不可点。  
4. 解为 0 的格不可点。  
5. 其他游戏无回归。

## 6. 确认

用户 2026-07-15 确认：A + Solution 网格反控 + Hub 同步可点 + 消元 tab 只读。

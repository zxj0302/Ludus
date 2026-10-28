# CHI Interactive Demo — Roadmap（优先）

> 状态：进行中  
> 日期：2026-07-15  
> 关联设计：`docs/superpowers/specs/2026-07-15-chi-demo-mode-design.md`  
> Steam：本阶段 **降优先**；仅在架构上预留 Meta/发行钩子，不实现 Steamworks。

## 1. 贡献主张（论文一句）

**Ludus** 在同一可玩实例上，用非侵入的渐进式揭示，把「手感 → 形式化问题 → 可运行求解器与算法可视化 → 可控关卡生成」串成可体验的算法素养工具，同时服务纯娱乐（L1）与主动学习者（L2/L3）。

合集广度是证据，**Demo 主角是 3 幕剧本**，不是 13 款 Hub。

## 2. 阶段划分

| 阶段 | 目标 | 主要工件 | 估计 |
|------|------|----------|------|
| **C0 叙事定稿** | 贡献点、Related Work 骨架、选 3 杀手关 | 本文 + Demo Mode spec | ✅ 本次 |
| **C1 Demo Mode** | `?demo=1` 剧本播放、旁白、固定种子关 | `playlist` schema + web Demo shell | 下一步 |
| **C2 展台打磨** | 英默认、大触控、离线包、viz 强调 | UI polish + release build | |
| **C3 轻量评估** | 走廊/课堂 n≈8–20，前后测 | 问卷 + 事件日志（可选） | |
| **C4 提交物** | 6 页论文、≤5 min 视频、静帧、展位平面 | `docs/publishing/chi-submission/` | |

参照：[CHI 2026 Interactive Demos](https://chi2026.acm.org/authors/interactive-demos/)（具体年份以当年 CFP 为准）。

## 3. 推荐 Demo 三幕（可改）

| 幕 | 游戏 | 展示点 | 为何 |
|----|------|--------|------|
| 1 | **Lights Out** | 玩 → Hint → 高斯消元矩阵 viz | 垂直切片最完整，P 问题可讲清 |
| 2 | **Nim 或 Kayles** | 玩 → XOR/nimber → 必胜提示 | Sprague–Grundy，与「隐藏 Nim」叙事强 |
| 3 | **Sokoban（小关）** | 玩 → BFS 搜索树 viz | 搜索/状态空间，对比「不是闭式公式」 |

备选替换：Sudoku+DLX、Connect Four（强解叙事重、现场时长紧）。

## 4. 提交检查清单（截稿前）

- [ ] ≤6 页 ACM 单栏论文（非匿名）
- [ ] ≤5 分钟 walkthrough 视频（建议 ≤3 分钟）
- [ ] ≥1500×1200 宣传静帧 + caption
- [ ] 展位平面（约 2×2 m）+ 排队与供电说明
- [ ] 离线可运行 release（Web 或桌面壳）
- [ ] Demo Mode 英默认、无网可完成三幕
- [ ] （强烈建议）至少一轮走廊测试笔记写入论文 Evaluation

## 5. 明确非目标（本阶段）

- Steamworks / 愿望单 / 商业化 entitlements  
- 再堆 backlog 新游戏  
- 强制看完教学才能玩  
- 微信小程序

## 6. 成功标准

1. 路人 **3 分钟内** 能完成至少一幕「玩 → 提示/求解 → 看见算法一步」。  
2. 评审不看现场也能从视频理解 **progressive disclosure + live solver**。  
3. 论文能指出与 Brilliant / VisuAlgo / cut-the-knot 的差异（可玩同实例 + 求解器 + 生成）。

# PROGRESS.md — Ludus 项目进度（唯一真相源）

> 本文件让任何一个全新的 Claude 实例仅凭它即可接续工作。
> 每次完成工件后按 CLAUDE.md A.3 更新本文件。

## 📍 CURRENT STATE

- **当前阶段**：阶段 0（立项对齐）即将开始 —— 仓库初始化。
- **已确认技术方向**：Web 优先 + React + TS + Tailwind + Framer Motion + React Flow/D3 + Tauri/Capacitor 套壳；微信降为可选。（见 DECISIONS.md ADR-009~012）
- **首个垂直切片**：Lights Out 点灯（ADR-004）。

## ✅ DONE

- 录入项目宪法与会话协议：`docs/CLAUDE.md`（或仓库根 `CLAUDE.md`）。
- 录入决策记录：`docs/DECISIONS.md`（含 ADR-000~012，平台与技术栈已定）。
- 录入长期游戏清单：`docs/phases/00-backlog.md`（B.3 完整 backlog + 早期开发顺序）。

## 🚧 IN PROGRESS

- 无。等待进入阶段 0。

## 🔖 NEXT ACTION（下一次会话第一步）

1. 以 **PM 角色** 进入 **阶段 0 立项对齐**：
   - 复述对项目愿景与差异点的理解（≤10 行）。
   - 列出未决问题清单，每条带"默认建议"（至少覆盖 ADR-006 monorepo 工具、ADR-007 LaTeX 方案、ADR-008 序列化 schema 版本化策略）。
   - 定义"成功标准"与"明确非目标"。
2. 产出后停下，等用户确认，再进入阶段 1。

## 🐛 KNOWN ISSUES

- 无（仓库尚无代码）。

## 📌 OPEN QUESTIONS / 待我确认

- ADR-006 Monorepo 工具链：pnpm workspaces / Turborepo / Nx（待阶段 2）。
- ADR-007 LaTeX 渲染：KaTeX vs MathJax（待阶段 3/4）。
- ADR-008 序列化 schema 与版本化策略（待阶段 2）。

## 📝 SESSION LOG

- [初始化] 创建 docs 骨架，写入 CLAUDE.md / DECISIONS.md / 00-backlog.md / PROGRESS.md；平台策略由"微信硬约束"调整为"Web 优先、Tauri/Capacitor 扩展、微信可选"（ADR-009~012）。

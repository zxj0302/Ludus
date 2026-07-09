# Ludus

> 寓教于乐的小游戏合集 — 把算法和数学包装成好玩的游戏

Ludus 让玩家在玩经典小游戏时，非侵入地被引导思考「如何最优、如何必胜、如何判定可行」，进而（自愿）展开学习背后的数学与算法。

**纯娱乐玩家完全零负担** — 教育内容默认折叠，渐进式揭示按需展开。

## 当前状态

**Phase 7 — 测试/发布进行中**。8 款游戏完整实现，384 个测试全过，CI 已配置，桌面壳可开发与打包。

| 游戏 | 核心算法 | 复杂度 |
|------|----------|--------|
| Lights Out 点灯 | GF(2) 高斯消元 | P |
| Sokoban 推箱子 | BFS + 死锁检测 | PSPACE-complete |
| Sudoku 数独 | DLX 精确覆盖 | NP-complete |
| Nim | Bouton XOR 定理 | P |
| Wythoff | Beatty 序列 + 黄金比例 | P |
| 15-Puzzle | A* + 曼哈顿距离 | NP-hard |
| 倒水谜题 | BFS + 裴蜀定理 | P |
| Nonogram | 线求解 + 回溯 | NP-complete |

每款游戏均包含：可玩实现 + 求解器 + 生成器（若适用）+ 难度度量 + 算法可视化 + 五段式教学（中英双语 L2/L3）。

## 技术栈

| 层 | 技术 |
|----|------|
| 核心逻辑 | TypeScript（框架无关，纯函数） |
| 游戏模块 | React 18 + Framer Motion（DOM/Canvas 按需） |
| 算法可视化 | React Flow + D3.js（懒加载） |
| 样式 | Tailwind CSS + Playful Bento 设计系统 |
| 状态管理 | Zustand |
| 构建 | Vite + pnpm monorepo |
| 桌面 | Tauri 2（WebView 套壳） |
| 移动 | Capacitor 6（配置就绪） |

## 快速开始

```bash
pnpm install

pnpm dev              # Web → http://127.0.0.1:5173
pnpm dev:desktop      # Tauri 桌面开发壳
pnpm test:run         # 384 测试
pnpm typecheck
pnpm build            # Web SPA
pnpm build:shell      # Tauri/Capacitor 相对路径构建
pnpm build:desktop    # Windows 安装包（需 Rust ≥ 1.85）
```

## 项目结构

```
Ludus/
├── apps/
│   ├── web/           # React SPA
│   ├── desktop/       # Tauri 2 套壳
│   └── mobile/        # Capacitor 配置
├── packages/
│   ├── core/          # 框架无关类型、Worker 协议
│   ├── games/         # 8 款游戏插件（自包含）
│   ├── education/     # 教学内容 Markdown
│   └── ui/            # 共享 UI 组件
└── docs/              # 设计文档、PROGRESS、ADR
```

## 架构

```
┌─────────────────────────────┐
│  Presentation (React)       │  ← apps/web
├─────────────────────────────┤
│  Education (Markdown)       │  ← packages/education
├─────────────────────────────┤
│  Game Modules (插件)         │  ← packages/games
├─────────────────────────────┤
│  Core Logic (纯 TS, 零 UI)  │  ← packages/core
└─────────────────────────────┘
```

逻辑与表现严格分离。新增游戏 = 新增 `packages/games` 目录 + registry 一行 + `entrySetup.tsx` 一个区块。

## 路线图

- [x] Phase 4：Lights Out 垂直切片
- [x] Phase 5：8 款增量游戏
- [x] Phase 6：Hub、进度、生成器 UI、Tauri/Capacitor 套壳
- [x] Phase 7：CI ✅、首个 release ✅、v0.1.1 桌面空白页修复版 ✅

完整 backlog：162 款游戏（`docs/phases/00-backlog.md`）。

## 开发

- `CONTRIBUTING.md` — 贡献指南
- `CHANGELOG.md` — 版本记录
- `docs/phases/07-release.md` — 发布流程
- `CLAUDE.md` — 项目宪法与会话协议
- `docs/PROGRESS.md` — 进度真相源

## 许可

MIT

# Ludus

> 寓教于乐的小游戏合集 — 把算法和数学包装成好玩的游戏

Ludus 让玩家在玩经典小游戏时，非侵入地被引导思考"如何最优、如何必胜、如何判定可行"，进而（自愿）展开学习背后的数学与算法。

**纯娱乐玩家完全零负担** — 教育内容默认折叠，渐进式揭示按需展开。

## 当前状态

**Phase 5 — 增量游戏进行中**。5 款游戏已完整实现，196 个测试全过。

| 游戏            | 核心算法               | 复杂度          |
| --------------- | ---------------------- | --------------- |
| Lights Out 点灯 | GF(2) 高斯消元         | P               |
| Sokoban 推箱子  | BFS + 死锁检测         | PSPACE-complete |
| Sudoku 数独     | DLX 精确覆盖           | NP-complete     |
| Nim             | Bouton XOR 定理        | P               |
| Wythoff         | Beatty 序列 + 黄金比例 | P               |

每款游戏均包含：可玩实现 + 正确求解器 + 关卡生成器 + 难度度量 + 算法可视化 + 五段式教学（中英双语 L2/L3）。

## 技术栈

| 层         | 技术                                     |
| ---------- | ---------------------------------------- |
| 核心逻辑   | TypeScript（框架无关，纯函数）           |
| 游戏引擎   | React 18 + Framer Motion                 |
| 算法可视化 | React Flow（图/树）+ D3.js（按需懒加载） |
| 样式       | Tailwind CSS + Playful Bento 设计系统    |
| 状态管理   | Zustand                                  |
| 构建       | Vite + pnpm monorepo                     |

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev          # → http://localhost:5173

# 运行测试
pnpm test:run

# 类型检查
pnpm typecheck

# 构建
pnpm build
```

## 项目结构

```
Ludus/
├── apps/web/              # Web 应用 (React SPA)
│   └── src/
│       ├── components/    # UI 组件 (GameShell, EducationPanel, 可视化等)
│       ├── stores/        # Zustand 状态管理
│       └── i18n/          # 中英翻译资源
├── packages/
│   ├── core/              # 核心逻辑层 (框架无关)
│   │   └── src/
│   │       ├── solver/    # 求解器 (GF(2), DLX, BFS, XOR, Beatty)
│   │       ├── generator/ # 关卡生成器
│   │       ├── difficulty/ # 难度度量
│   │       └── types/     # 统一类型定义
│   ├── games/             # 游戏模块层 (插件化)
│   │   └── src/
│   │       ├── lightsout/ # 点灯
│   │       ├── sokoban/   # 推箱子
│   │       ├── sudoku/    # 数独
│   │       ├── nim/       # Nim
│   │       └── wythoff/   # Wythoff
│   └── education/         # 教学内容 (Markdown + LaTeX)
│       └── src/content/   # L2/L3 × zh-CN/en
└── docs/                  # 设计文档与进度追踪
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

逻辑与表现严格分离。Core 层可在 Node / 浏览器 / Web Worker / 桌面 / 移动端复用，不含任何 UI 依赖。新增游戏 = 新增插件模块，不改核心。

## 路线图

- [X] Phase 4：Lights Out 垂直切片（架构验证）
- [X] Phase 5a–d：Sokoban, Sudoku, Nim, Wythoff
- [ ] Phase 5e：15-puzzle (A\* 启发式搜索)
- [ ] Phase 6：合集主界面、进度成就、跨平台打包
- [ ] Phase 7：测试/性能/发布

完整 backlog：162 款游戏，覆盖 16 个算法领域（见 `docs/phases/00-backlog.md`）。

## 开发

本项目遵循严格的增量交付协议。一次只推进一个明确工件，每个工件完成后更新 `docs/PROGRESS.md`。

开发者入口文件：

- `CLAUDE.md` — 会话协议与项目宪法
- `docs/PROGRESS.md` — 进度追踪（唯一真相源）
- `docs/DECISIONS.md` — 已确认决策 (ADR)
- `docs/lessons-learned.md` — 开发经验积累

## 许可

MIT

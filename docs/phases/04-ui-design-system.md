# Ludus UI Design System — "Playful Bento"

> **角色**：UX·UI  
> **阶段**：横切（阶段 4 前确立，贯穿所有游戏模块）  
> **状态**：✅ ACCEPTED  
> **依赖决策**：ADR-003（渐进式揭示）、ADR-009（平台优先级）、ADR-010（React + Tauri + Capacitor）、ADR-011（渲染分层）、ADR-012（手感与美术）

---

## 目录

1. [设计哲学](#1-设计哲学)
2. [Bento Box 适配论证](#2-bento-box-适配论证)
3. [视觉语言 — Design Tokens](#3-视觉语言--design-tokens)
4. [布局系统](#4-布局系统)
5. [组件架构](#5-组件架构)
6. [页面模板](#6-页面模板)
7. [动效规范](#7-动效规范)
8. [响应式策略](#8-响应式策略)
9. [可访问性](#9-可访问性)
10. [实现指南](#10-实现指南)

---

## 1. 设计哲学

### 1.1 核心原则

| # | 原则 | 含义 | 验证方式 |
|---|---|---|---|
| P1 | **游戏第一** | 游戏棋盘始终是视觉主角，UI 框架退后 | 模糊测试：眯眼看任何页面，游戏区域必须是最显眼的 |
| P2 | **空间即层级** | 信息层次用空间位置表达，不依赖"展开/折叠"按钮 | L1 内容在表面、L2 在侧边卡、L3 在深层面板 |
| P3 | **温度克制** | 温暖但不喧闹，精致但不冷感 | 暖石色底 + 靛蓝逻辑点缀 + 琥珀游戏温度 |
| P4 | **模块即卡片** | 每个功能单元是一张 Bento 卡，可独立存在也可拼入网格 | 游戏入口卡、知识卡、求解器卡——同一套视觉语言 |
| P5 | **触觉反馈** | 每次交互有对应的物理动效，像在"操作真实物体" | 点击有按压感、悬停有升起感、胜利有绽放感 |

### 1.2 视觉定位

```
冷/极简               ← Ludus →                暖/游戏
Apple Human Interface    │    Steam/Nintendo
Linear/Notion            │    Monument Valley
                         │
              "Playful Bento"
              干净结构 × 温暖温度 × 游戏活力
```

我们取中间偏右：**比 Notion 暖，比 Nintendo eShop 克制**。一眼看过去是"精致的工具"，但手指放上去是"可以玩的东西"。

### 1.3 L1/L2/L3 的空间隐喻

```
┌──────────────────────────────────────────────┐
│  L1 表面层（游戏棋盘、基本控件）                │ ← 始终可见，占最大面积
│                                               │
│  ┌─ L2 侧边卡 ─┐  ┌─ L3 深层面板 ──────────┐ │
│  │ 一句话原理    │  │ 形式化定义 / LaTeX       │ │ ← 可选展开
│  │ 可选知识卡    │  │ 求解器步骤可视化          │ │
│  │              │  │ 阅读源码                  │ │
│  └──────────────┘  └─────────────────────────┘ │
└──────────────────────────────────────────────┘
```

> 这一隐喻直接映射到 Bento box：L1 = 主卡（最大的网格单元），L2 = 侧卡，L3 = 面板/抽屉。三者不是"折叠/展开"的二元关系，而是**空间上同时存在、注意力上按需深入**。

---

## 2. Bento Box 适配论证

### 2.1 什么不用纯 Apple Bento

Apple 式 Bento（如 App Store Today 标签）的局限：
- 卡片内容**静态**，不适合交互密集的游戏棋盘
- 圆角过大（32–40px）会吃掉游戏棋盘的有效面积
- 卡片内间距过宽松，不适合需要紧密布局的网格游戏

### 2.2 Ludus 的 Bento 改造

| Bento 特征 | Apple 做法 | Ludus 做法 |
|---|---|---|
| **卡片圆角** | 32–40px，统一 | 分层：Hub 卡片 24px，面板 16px，游戏内控件 12px，棋盘 8px |
| **网格单位** | 基于内容高度，不规则 | 基于 4px 栅格，**8 种预设尺寸**，强制对齐 |
| **玻璃效果** | 大量使用，透明度 60–70% | **仅 Hub 层**使用。游戏内面板用实色背景，避免干扰棋盘可读性 |
| **卡片内交互** | 主要为点击跳转 | 支持高频交互（点击灯、拖拽数字），卡片只是**容器**不抢交互 |
| **色彩** | 低饱和度，接近单色 | 引入 3 个色彩角色（靛蓝/琥珀/青碧），每个有明确语义 |
| **排版层次** | 大字重对比 | 保持层次但字体更紧凑，为游戏棋盘留空间 |

### 2.3 Bento 网格的游戏化适配

传统 Bento 网格单元大小不一，适合内容展示。Ludus 在此基础上增加两条规则：

1. **游戏入口卡**：永远大于或等于 2×1 单元，带实时预览（不是静态封面）
2. **"Hero 位"轮换**：当前活跃/最近玩过的游戏自动占据 Hub 最大卡位（2×2），类似于"继续游戏"的 PS5 主屏

---

## 3. 视觉语言 — Design Tokens

### 3.1 颜色体系

所有颜色定义为 CSS 变量，支持未来暗色模式扩展。

#### 中性色 — Warm Stone

| Token | 色值 | 用途 |
|---|---|---|
| `--color-bg-primary` | `#FAFAF9` | 页面底色 |
| `--color-bg-secondary` | `#F5F5F4` | 卡片底色、面板底 |
| `--color-bg-tertiary` | `#ECECEA` | 悬停态底色 |
| `--color-bg-glass` | `rgba(250,250,249,0.72)` | 玻璃卡片底（Hub 层） |
| `--color-border-light` | `#E7E5E4` | 轻分隔线 |
| `--color-border` | `#D6D3D1` | 标准边框 |
| `--color-text-primary` | `#292524` | 正文、标题 |
| `--color-text-secondary` | `#57534E` | 辅助文字 |
| `--color-text-tertiary` | `#78716C` | 占位符、禁用态 |
| `--color-text-inverse` | `#FAFAF9` | 深色底上文字 |

#### 品牌色 — Logic Indigo

| Token | 色值 | 用途 |
|---|---|---|
| `--color-brand-50` → `900` | Indigo 50–900 | 主按钮、选中态、链接、品牌标识 |
| `--color-brand` | `#6366F1` (500) | 默认品牌色 |
| `--color-brand-hover` | `#4F46E5` (600) | 悬停 |
| `--color-brand-active` | `#4338CA` (700) | 按下 |

#### 温度色 — Game Amber

| Token | 色值 | 用途 |
|---|---|---|
| `--color-warm-50` → `900` | Amber 50–900 | 游戏得分、成就高亮、进度条填充、胜利粒子 |
| `--color-warm` | `#F59E0B` (500) | 默认温度色 |

#### 清晰色 — Clarity Teal

| Token | 色值 | 用途 |
|---|---|---|
| `--color-clarity-50` → `900` | Teal 50–900 | 教育内容高亮、求解成功、知识卡边框、正确走子 |
| `--color-clarity` | `#14B8A6` (500) | 默认清晰色 |

#### 语义色

| Token | 色值 | 用途 |
|---|---|---|
| `--color-success` | `#10B981` (Emerald 500) | 成功/通关 |
| `--color-warning` | `#F59E0B` (Amber 500) | 警告/提示 |
| `--color-error` | `#F43F5E` (Rose 500) | 错误/无效操作 |
| `--color-info` | `#0EA5E9` (Sky 500) | 信息提示 |

#### 游戏专属强调色（每模块可声明）

| 游戏 | 强调色 | 色值 |
|---|---|---|
| Lights Out | Electric Blue + Amber | `#3B82F6` / `#F59E0B` (灯亮/灯灭) |
| 数独 | Deep Navy + White | `#1E3A5F` / `#FFFFFF` |
| Nim/Wythoff | Forest Green + Stone | `#15803D` / `#78716C` |

### 3.2 字体体系

#### 字体栈

```css
/* UI 正文 — 拉丁优先 Inter，中文回落系统字体 */
--font-sans: "Inter", "Inter Fallback", "PingFang SC", "Noto Sans SC",
             "Microsoft YaHei", "Hiragino Sans GB", sans-serif;

/* 展示/数字 — 用于大标题、得分、计数器 */
--font-display: "Inter Display", "Inter", var(--font-sans);

/* 等宽 — 代码、求解器输出、LaTeX 源码 */
--font-mono: "JetBrains Mono", "Fira Code", "Cascadia Code",
             "SF Mono", "Menlo", monospace;
```

Inter 通过 `next/font` 或手动 `@font-face` 加载，子集化为 Latin + 常用符号，首屏体积控制在 ~40KB（woff2）。

#### 字号阶梯（Type Scale）

采用 **Major Third (1.25)** 比例，基准 16px：

| Token | 尺寸 | 行高 | 用途 |
|---|---|---|---|
| `text-xs` | 12px | 16px | 辅助标注、图例 |
| `text-sm` | 14px | 20px | 说明文字、卡片副标题 |
| `text-base` | 16px | 24px | 正文 |
| `text-lg` | 20px | 28px | 小标题、面板标题 |
| `text-xl` | 25px | 32px | 卡片标题 |
| `text-2xl` | 31px | 40px | 页面标题 |
| `text-3xl` | 39px | 48px | Hub Hero 标题 |
| `text-4xl` | 48px | 56px | 通关祝贺、大数字 |

#### 字重使用规范

| 字重 | 用途 |
|---|---|
| 400 Regular | 正文、说明、控件标签 |
| 500 Medium | 小标题、卡片标题、按钮 |
| 600 Semibold | 页面标题、面板标题 |
| 700 Bold | Hero 标题、通关数字 |
| 800 Extrabold | 仅用于超大展示数字（得分等），谨慎使用 |

### 3.3 间距体系

基于 4px 基准，Tailwind 默认间距即为 4px 步进，无需自定义：

| Token | 值 | 用途 |
|---|---|---|
| `1` (4px) | 4px | 图标与文字间距、紧密内边距 |
| `2` (8px) | 8px | 行内间距、标签内边距 |
| `3` (12px) | 12px | 卡片内小边距 |
| `4` (16px) | 16px | 标准内边距、同组元素间距 |
| `6` (24px) | 24px | 卡片内边距、面板内边距 |
| `8` (32px) | 32px | 节间距、卡片间间距 |
| `12` (48px) | 48px | 大节间距 |
| `16` (64px) | 64px | 页面级间距 |

### 3.4 圆角体系

这是 Bento 风格的关键差异点：**分层圆角**。

| Token | 值 | 用途 | 示例 |
|---|---|---|---|
| `rounded-sm` | 6px | 输入框、小按钮、标签 | 关卡选择器 |
| `rounded-md` | 10px | 标准按钮、控件面板、工具栏 | 游戏工具栏 |
| `rounded-lg` | 14px | 侧面板、知识卡、小卡片 | L2 知识卡 |
| `rounded-xl` | 18px | Hub 游戏入口卡、教育面板 | 游戏入口 |
| `rounded-2xl` | 24px | Hero 卡、大面板、Modal | 继续游戏 Hero |
| `rounded-full` | 9999px | 头像、状态指示器、药丸按钮 | 通关标记 |

> 规则：**同一嵌套层级内圆角递减 4–6px**。外层卡片 `rounded-xl`(18px)，内嵌控件 `rounded-md`(10px)，保持视觉和谐。

### 3.5 阴影与海拔

Bento 阴影特点是**多层、柔软、色温与底色一致**。

| Token | 值 | 海拔 | 用途 |
|---|---|---|---|
| `shadow-flat` | none | 0 | 与背景同色的面板 |
| `shadow-raised` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` | 1 | 标准卡片 |
| `shadow-floating` | `0 4px 6px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.04)` | 2 | 悬浮面板、下拉 |
| `shadow-modal` | `0 0 0 1px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.06)` | 3 | Modal、抽屉 |
| `shadow-glow-brand` | `0 0 0 3px rgba(99,102,241,0.15)` | — | Focus ring / 选中态光晕 |
| `shadow-glow-success` | `0 0 0 3px rgba(16,185,129,0.15)` | — | 通关光晕 |

> Tailwind 默认阴影偏冷偏硬，需在 `tailwind.config.ts` 中覆盖。

### 3.6 玻璃效果（仅 Hub 层）

```css
.glass-card {
  background: rgba(250, 250, 249, 0.72);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.glass-card-darker {
  background: rgba(245, 245, 244, 0.80);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
```

使用原则：
- **仅在 Hub 首页**使用玻璃效果，营造"浏览陈列柜"的感觉
- **游戏内面板**使用实色背景（`--color-bg-secondary`），确保棋盘可读性不受背景透射干扰
- 移动端降低 transparency（+5–10% 不透明度），因为移动 WebView 中 `backdrop-filter` 性能有限

---

## 4. 布局系统

### 4.1 Bento 网格定义

Hub 层采用 **6 列 Bento 网格**（桌面），最小卡片单元为 `1 × 1`（宽 1 列 × 高 1 行单元）：

```
桌面 (≥1024px): 6 列
┌────┬────┬────┬────┬────┬────┐
│ 2×2      │ 2×1      │ 2×1      │
│          ├────┬────┤          │
│          │1×1 │1×1 │          │
├────┬────┼────┴────┼────┬────┤
│1×1 │1×1 │ 2×2      │1×1 │1×1 │
│    │    │          │    │    │
└────┴────┴───────────┴────┴────┘

平板 (640–1023px): 4 列
手机 (<640px): 2 列，全部卡强制 2 列宽
```

#### 卡片预设尺寸

| 预设 | 列 × 行（桌面） | 用途 |
|---|---|---|
| `card-1x1` | 1 × 1 | 统计卡、知识卡、小工具入口 |
| `card-2x1` | 2 × 1 | 普通游戏入口、最近游戏 |
| `card-1x2` | 1 × 2 | 纵向信息卡（排行榜、成就） |
| `card-2x2` | 2 × 2 | 主打游戏入口、Hero 位 |
| `card-3x2` | 3 × 2 | 活动推广、教程入口 |
| `card-3x1` | 3 × 1 | 宽横幅（每日挑战等） |
| `card-4x2` | 4 × 2 | 超大 Hero（首页顶部） |
| `card-6x1` | 6 × 1 | 全宽条（合集标题栏） |

#### 行高基准

- 桌面：1 行单元 = 144px
- 平板：1 行单元 = 120px
- 手机：1 行单元 = 96px

卡内边距与行高配合：`card-1x1` = 144×144px 外部尺寸，内部 padding 16px，内容区 112×112px，恰好容纳游戏 icon(64px) + 标题文字。

### 4.2 Hub 布局模板

```
┌─────────────────────────────────────────────────────┐
│  Logo                  Nav   i18n   Settings   Avatar│ ← 顶部导航 56px
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─ Hero 4×2 ───────────────────────────────────┐   │
│  │  "继续游戏" — 最近玩过的游戏大卡               │   │ ← Hero 位
│  │  游戏名 + 进度 + 一键继续                      │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ 2×2 ───────┐ ┌─ 2×2 ───────┐ ┌─ 2×2 ───────┐  │
│  │ Lights Out   │ │   数独      │ │ Nim/Wythoff │  │ ← 游戏入口
│  │ [预览动画]   │ │  [预览动画] │ │ [预览动画]  │  │   网格
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                       │
│  ┌─ 3×1 ─────────────────────────────────────────┐  │
│  │  "今日挑战" — 每日一道随机谜题                  │  │ ← 动态内容
│  └──────────────────────────────────────────────┘  │
│                                                       │
│  ┌─ 2×1 ──────────┐  ┌─ 2×1 ──────────┐  ┌─ 2×1 ┐  │
│  │ 统计: 已解决     │  │ 学习进度       │  │ 成就  │  │ ← 统计卡
│  └─────────────────┘  └────────────────┘  └───────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 4.3 Game Shell 布局模板

```
┌─────────────────────────────────────────────────────┐
│  ← 返回合集    Lights Out    关卡 3/20   ⚑ ?  🔍   │ ← 游戏顶栏 48px
├──────────────────────────┬──────────────────────────┤
│                          │                           │
│                          │  ┌─ L2 知识卡 ─────────┐ │
│    游戏棋盘区域           │  │ 这个问题属于线性代数  │ │
│    (最大面积，居中)       │  │ 复杂度: P            │ │
│                          │  │                      │ │
│    ┌──────────────┐      │  │ [深入了解 → L3]     │ │
│    │              │      │  └─────────────────────┘ │
│    │  5×5 网格    │      │                           │
│    │  或          │      │  ┌─ 求解器面板 ────────┐ │
│    │  9×9 数独    │      │  │ 高斯消元步骤可视化    │ │
│    │              │      │  │ [React Flow 图]      │ │
│    └──────────────┘      │  │                      │ │
│                          │  └─────────────────────┘ │
│  ┌─ 工具栏 ────────────┐ │                           │
│  │ ↩ 撤销  ↪ 重做  ⟳ 重置 │ │ ← 游戏控件             │
│  └─────────────────────┘ │                           │
├──────────────────────────┴──────────────────────────┤
│  步数: 7/20     最优解: 5 步    距最优: +2 步        │ ← 状态栏 36px
└─────────────────────────────────────────────────────┘
```

关键比例：
- **棋盘区**：占可用宽度 ≥60%（桌面），移动端占 100% 宽度
- **侧面板**：桌面 320–400px 宽；平板/手机改为底部 Sheet
- **顶栏**：48px，紧凑但不拥挤
- **状态栏**：36px，显示步数/最优解/难度等元信息

### 4.4 教育面板布局（L3 深度展开）

```
┌─ L3 教育面板（Drawer / 侧边 Modal）─────────────────┐
│                                                       │
│  📐 形式化定义                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ 设 A 为 n×n 的 GF(2) 矩阵，其中 aᵢⱼ=1 ⟺         │ │
│  │ 按下格子 j 会翻转格子 i。给定初始状态向量 b，      │ │
│  │ 求 x 使得 Ax = b (mod 2)。                       │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ⏱ 复杂度: P (高斯消元 O(n³)，但 n≤5 可实时解)       │
│                                                       │
│  🧮 求解器演示                                        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ [React Flow 增广矩阵行变换动画]                   │ │
│  │                                                  │ │
│  │  ① 构造增广矩阵 [A|b]                             │ │
│  │  ② 前向消元 → ③ 回代                              │ │
│  │  ④ 若存在自由变量 → 零空间解集                    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  📝 相关阅读: 线性代数 GF(2) | 高斯消元 | 零空间      │
│                                                       │
│  [查看求解器源码]  [自己出题]                          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 5. 组件架构

### 5.1 组件树（按包划分）

```
packages/ui/                        ← 通用 UI 组件
├── BentoGrid.tsx                   ← Bento 网格容器
├── BentoCard.tsx                   ← 单张 Bento 卡
├── GlassCard.tsx                   ← 玻璃特效卡（Hub 专用）
├── GameShell.tsx                   ← 游戏外壳（顶栏 + 棋盘区 + 工具栏 + 状态栏）
├── GameToolbar.tsx                 ← 游戏工具栏（撤销/重做/重置/提示）
├── GameStatusBar.tsx               ← 底部状态栏
├── ProgressiveDisclosure.tsx       ← 渐进式揭示容器（L1/L2/L3 三态）
├── KnowledgeCard.tsx               ← L2 知识卡
├── EducationPanel.tsx              ← L3 深度教育面板（Drawer）
├── SolverVizPanel.tsx              ← 求解器可视化面板
├── NavBar.tsx                      ← 顶部导航
├── TabBar.tsx                      ← 移动端底部 Tab
├── Button.tsx                      ← 按钮（variant: primary/secondary/ghost/danger）
├── IconButton.tsx                  ← 纯图标按钮
├── Badge.tsx                       ← 徽标（难度/复杂度标签）
├── ProgressBar.tsx                 ← 进度条
├── DifficultyMeter.tsx             ← 难度指示计
└── I18nProvider.tsx                ← 语言切换 Provider

apps/web/src/                      ← 算法可视化组件（按 trace.type 懒加载）
├── MatrixViz.tsx                   ← 矩阵行变换动画（D3）
├── BFSTreeViz.tsx                  ← 搜索树（custom SVG）
├── DLXMatrixViz.tsx                ← 约束传播（custom SVG）
├── NimTreeViz.tsx                  ← 博弈树（React Flow）
└── WythoffTreeViz.tsx              ← Beatty 对（React Flow）

packages/games/<game-id>/           ← 各游戏模块
└── render.tsx                      ← 游戏棋盘渲染（DOM 或 Canvas）
```

### 5.2 关键组件规格

#### BentoCard

```typescript
interface BentoCardProps {
  /** 预设尺寸: 1x1 | 2x1 | 1x2 | 2x2 | 3x2 | 3x1 | 4x2 | 6x1 */
  size: BentoCardSize;
  /** 视觉变体 */
  variant: 'flat' | 'raised' | 'glass' | 'interactive';
  /** 是否带悬停动效（仅 interactive） */
  hoverable?: boolean;
  /** 点击回调（interactive 变体必传） */
  onClick?: () => void;
  /** 游戏强调色覆盖（用于游戏入口卡） */
  accentColor?: string;
  /** 内容插槽 */
  children: React.ReactNode;
}
```

视觉规格：
- `flat`：无阴影，与背景同色系稍深
- `raised`：`shadow-raised`，用于游戏内面板
- `glass`：玻璃效果（仅 Hub），`backdrop-blur-xl`
- `interactive`：`raised` + 悬停 `scale(1.02)` + `shadow-floating` 过渡

#### GameShell

```typescript
interface GameShellProps {
  /** 游戏 ID */
  gameId: string;
  /** 游戏显示名称 (i18n key) */
  title: string;
  /** 当前关卡号 (1-based) */
  level?: number;
  /** 总关卡数 */
  totalLevels?: number;
  /** 工具栏动作 */
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
  onHint?: () => void;
  /** 可撤销/重做状态 */
  canUndo?: boolean;
  canRedo?: boolean;
  /** 侧边面板内容 */
  sidePanel?: React.ReactNode;
  /** 状态栏信息 */
  statusBar?: GameStatus;
  /** 教育面板(L3) */
  educationPanel?: React.ReactNode;
  /** 渲染后端类型（影响 Canvas 容器创建） */
  renderBackend: 'dom' | 'canvas';
}
```

布局规则：
- 顶栏 48px：`flex items-center`，左侧返回+标题，右侧工具图标
- 棋盘区：`flex-1 grid place-items-center`，背景 `--color-bg-primary`
- 工具栏：`h-12 flex items-center justify-center gap-4`
- 状态栏：`h-9 flex items-center justify-between px-4 text-sm text-secondary`
- 侧面板：`w-80 xl:w-96`，右侧吸附，`overflow-y-auto`

#### ProgressiveDisclosure

L1/L2/L3 三态切换容器：

```typescript
interface ProgressiveDisclosureProps {
  /** 当前层级 */
  level: 1 | 2 | 3;
  /** L1 内容（始终可见层） */
  l1Content: React.ReactNode;
  /** L2 内容（知识卡覆盖层） */
  l2Content: React.ReactNode;
  /** L3 内容（深度面板） */
  l3Content: React.ReactNode;
  /** 层级切换回调 */
  onLevelChange: (level: 1 | 2 | 3) => void;
  /** L2 触发方式 */
  l2Trigger: 'button' | 'hover' | 'auto';
}
```

交互流：
```
L1 纯玩 ──[点击"?"按钮]──→ L2 知识卡浮层 ──[点击"深入了解"]──→ L3 教育面板 (Drawer)
  ↑                              ↑                                    │
  └──── [关闭/点击空白区] ────────┘←──── [← 返回] ────────────────────┘
```

- L2 知识卡：从游戏棋盘右下角浮出，宽 280px，不遮挡主要游戏区域
- L3 教育面板：从右侧滑入 Drawer，桌面 480px 宽，移动端全屏 Bottom Sheet
- 过渡动画：L2 用 `scale(0.95)→scale(1)` + `opacity 0→1`，200ms spring；L3 用 `translateX(100%)→0`，300ms spring

---

## 6. 页面模板

### 6.1 首页 — Hub

```
┌─────────────────────────────────────────────────────┐
│  [L] Ludus     游戏合集  统计  关于    🌐  ⚙️  👤   │ ← NavBar 56px
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─ Hero 4×2 ───────────────────────────────────┐   │
│  │  🎮  继续游戏                                  │   │
│  │  Lights Out — 关卡 7           [▶ 继续]       │   │
│  │  ▓▓▓▓▓▓▓▓▓░░░ 70% 进度                      │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ 2×2 ───────┐ ┌─ 2×2 ───────┐ ┌─ 2×2 ───────┐  │
│  │ 💡           │ │ 🧩          │ │ 🎯           │  │
│  │ Lights Out   │ │   数独      │ │ Nim/Wythoff │  │
│  │ 线性代数 GF2 │ │ CSP / DLX  │ │ 组合博弈论   │  │
│  │ ⭐⭐⭐☆☆     │ │ ⭐⭐☆☆☆    │ │ ⭐⭐☆☆☆    │  │
│  │ [▶ 玩] [📖] │ │ [▶ 玩] [📖]│ │ [▶ 玩] [📖] │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                       │
│  ┌─ 3×1 每日挑战 ───────────────────────────────┐   │
│  │  🌅 今日挑战: 最少步数点亮所有灯               │   │
│  │  已有 1,247 人完成             [接受挑战 →]   │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌─ 2×1 ──────┐ ┌─ 2×1 ──────┐ ┌─ 2×1 ──────┐     │
│  │ 📊 已解 42  │ │ 📚 学习 7   │ │ 🏆 成就 3   │     │
│  │ 最优 18 次  │ │ 3 个知识点  │ │ 12 个待解锁  │     │
│  └─────────────┘ └─────────────┘ └──────────────┘     │
│                                                       │
│  ┌─ 6×1 即将推出 ───────────────────────────────┐   │
│  │  15-puzzle  ·  倒水问题  ·  Nonogram  ·  ...  │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 6.2 游戏内 — Game View

```
┌─────────────────────────────────────────────────────┐
│  ← 合集  Lights Out  关卡 7 / 20      ?  🌐  ⋮     │ ← 顶栏
├───────────────────────┬─────────────────────────────┤
│                       │                              │
│   ┌───────────────┐   │  ┌─ 提示 ───────────────┐  │
│   │ ○ ● ○ ● ○    │   │  │ 每次操作翻转相邻的灯   │  │
│   │ ● ○ ○ ● ○    │   │  │                      │  │
│   │ ○ ● ○ ○ ●    │   │  │ 复杂度: P (简单)     │  │
│   │ ● ○ ● ● ○    │   │  └──────────────────────┘  │
│   │ ○ ○ ● ○ ○    │   │                              │
│   └───────────────┘   │  ┌─ 求解器 ─────────────┐  │
│                       │  │ 当前状态 → 解: 3 步    │  │
│  ↩  ↪  ⟳  💡        │  │                      │  │
│                       │  │ [查看步骤可视化 →]    │  │
│                       │  └──────────────────────┘  │
├───────────────────────┴─────────────────────────────┤
│  步数: 7    最优解: 5 步    ⌛ 00:42                 │
└─────────────────────────────────────────────────────┘
```

### 6.3 L3 展开 — 教育深度视图

```
┌────────────────────────┬────────────────────────────┐
│  游戏棋盘（缩小至 60%） │  ✕ 关闭面板                │
│                        │                            │
│  ┌──────────────┐     │  📐 形式化定义               │
│  │ ○ ● ○ ● ○   │     │  ┌────────────────────────┐ │
│  │ ● ○ ○ ● ○   │     │  │ min ‖x‖₁               │ │
│  │ ○ ● ○ ○ ●   │     │  │ s.t. A x = b (mod 2)   │ │
│  └──────────────┘     │  │ x ∈ {0,1}ⁿ             │ │
│                        │  └────────────────────────┘ │
│  ↩  ↪  ⟳            │                            │
│                        │  ⏱ 复杂度: P               │
│                        │  🧠 NP 难变体: min-step    │
│                        │     Lights Out is NP-hard  │
│                        │                            │
│                        │  🧮 求解器: 高斯消元 GF(2)  │
│                        │  ┌────────────────────────┐ │
│                        │  │ [增广矩阵行变换动画]    │ │
│                        │  │                        │ │
│                        │  │ R₁: [1 1 0 1 0 | 1]   │ │
│                        │  │ R₂: [1 1 1 0 1 | 0]   │ │
│                        │  │ → R₂ = R₂ - R₁        │ │
│                        │  │ R₂: [0 0 1 1 1 | 1]   │ │
│                        │  └────────────────────────┘ │
│                        │  [▶ 播放] [⏸] [⏭] [重置] │
│                        │                            │
│                        │  📝 相关: GF(2) | 消元 |   │
│                        │  零空间 | 最优解 NP-hard    │
│                        │                            │
│                        │  [查看源码]  [自己出题]     │
├────────────────────────┴────────────────────────────┤
│  步数: 7    最优: 5 步                               │
└─────────────────────────────────────────────────────┘
```

---

## 7. 动效规范

### 7.1 动效哲学

> "动效是信息，不是装饰。"

- **功能性动效**：表达状态变化（走子、胜利、撤销）→ 必须做
- **反馈性动效**：确认用户操作已被接收（按钮按压、卡片悬停）→ 必须做
- **氛围性动效**：页面转场、背景微动 → 做但不喧宾夺主
- **禁止**：纯装饰性粒子、无意义的弹跳、超过 500ms 的入场动画

### 7.2 Framer Motion 变体定义

#### 页面转场

```typescript
const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }, // ease-out
};
```

#### Bento 卡片入场

卡片从 Hub 网格中依次淡入，每张延迟 50ms：

```typescript
const cardStagger = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }, // spring-like
  }),
};
```

#### 卡片悬停（仅 `interactive` 变体）

```typescript
const cardHover = {
  rest: { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 10px 20px rgba(0,0,0,0.04)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};
```

#### 游戏走子动画

每款游戏定义自己的 `moveAnimation`，通用模式：

```typescript
const moveAnimation = {
  initial: { scale: 1 },
  apply: { scale: [1, 0.85, 1.05, 1], transition: { duration: 0.2, times: [0, 0.3, 0.6, 1] } },
  // 按压 → 反弹 → 稳定，模拟"按灯"的物理感
};
```

#### 知识卡浮出（L2 触发）

```typescript
const knowledgeCardReveal = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
};
```

#### 教育面板滑入（L3 触发）

```typescript
const educationPanelSlide = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
  },
};
```

#### 胜利状态

```typescript
const victoryAnimation = {
  hidden: { scale: 1, borderColor: 'transparent' },
  visible: {
    scale: [1, 1.04, 1],
    borderColor: ['transparent', '#10B981', '#10B981'],
    transition: { scale: { duration: 0.5 }, borderColor: { duration: 0.3 } },
  },
};
// 同时触发 shadow-glow-success 光晕
```

### 7.3 时长阶梯

| 类型 | 时长 | 缓动 | 示例 |
|---|---|---|---|
| 微交互（按压、悬停） | 100–150ms | `ease-out` | 按钮 click 反馈 |
| 小过渡（卡片入场、走子） | 200–300ms | `ease-out` 或 `spring(400,28)` | 卡片出现、灯翻转 |
| 面板转场（Drawer、Sheet） | 250–350ms | `spring(300,30)` | L3 面板滑入 |
| 页面转场 | 200–300ms | `ease-in-out` | Hub → 游戏内 |
| 胜利动画 | 500–800ms | `spring` + 序列 | 通关光晕 + 数字跳动 |

### 7.4 减少动效（prefers-reduced-motion）

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

在 Framer Motion 侧，全局监听 `prefers-reduced-motion`，将 `duration` 强制为 0 并禁用 spring 物理效果。

---

## 8. 响应式策略

### 8.1 断点定义

| 断点 | 宽度 | 列数 | 布局模式 |
|---|---|---|---|
| `sm` | ≥640px | 2 列 | 手机横屏 / 小平板 |
| `md` | ≥768px | 4 列 | 平板竖屏 |
| `lg` | ≥1024px | 6 列 | 桌面 / 平板横屏 |
| `xl` | ≥1280px | 6 列（宽间距） | 大桌面 |

### 8.2 逐层适配策略

| 层 | 手机 (<768px) | 平板 (768–1023px) | 桌面 (≥1024px) |
|---|---|---|---|
| **Hub 网格** | 2 列，全卡片 2 列宽；Hero 2 行高 | 4 列；Hero 可 4 列宽 | 6 列 Bento 网格全能力 |
| **游戏棋盘** | 全宽，上方无遮挡 | 居中，侧面板可折叠 | 棋盘 + 侧面板并排 |
| **L2 知识卡** | 底部浮出 Sheet，高 40vh | 右下角浮出，宽 280px | 右下角浮出，宽 300px |
| **L3 教育面板** | 全屏 Bottom Sheet | 右侧 Drawer，宽 420px | 右侧 Drawer，宽 480px |
| **工具栏** | 棋盘下方固定，间距紧凑 | 棋盘下方，间距正常 | 棋盘下方，可含提示文字 |
| **顶栏** | 48px，简化（仅返回+标题） | 48px，完整 | 48px，完整含搜索 |
| **玻璃效果** | 关闭（性能），用实色替代 | 可选开启 | 完整开启 |

### 8.3 移动端特殊处理

- **底部 TabBar**（仅手机）：3 个标签 —— 合集 · 当前游戏 · 统计
- **触摸目标**：所有可交互元素最小 44×44px（Apple HIG）
- **滑动手势**：L3 面板支持下滑关闭
- **Canvas 游戏**：移动端 Canvas 分辨率降至 1x（避免高 DPI 性能问题），大网格游戏（≥15×15）手机端自动缩小单元格

---

## 9. 可访问性

### 9.1 色盲友好

- **红/绿不单独承载信息**：胜利状态同时用光晕 + 文字 + 图标表达
- **Lights Out**：灯亮 = 琥珀色填充 + "●"图标，灯灭 = 灰色空心 + "○"，不依赖颜色区分
- **所有游戏的状态指示器**必须同时有形状/图标差异

### 9.2 键盘导航

- Tab 键在 Hub 卡片间移动焦点，Enter 进入游戏
- 游戏内支持方向键操作（←↑→↓ 移动光标，Space/Enter 确认走子）
- Escape 关闭任何面板/浮层
- 焦点环使用 `shadow-glow-brand`，始终可见

### 9.3 屏幕阅读器

- 所有图标按钮必须有 `aria-label`
- 棋盘单元格标注行列位置（如 "第 3 行第 4 列，已点亮"）
- 步数/状态栏信息使用 `aria-live="polite"` 区域
- L2/L3 面板展开时管理焦点陷阱

### 9.4 对比度

所有文字-背景组合满足 WCAG AA：
- 正文 ≥ 4.5:1
- 大文字（≥18px bold） ≥ 3:1
- 禁用状态文字不要求（但尽量保持 3:1 以上）

当前 Warm Stone 色板验证：
- `text-primary (#292524)` on `bg-primary (#FAFAF9)` = **13.2:1** ✅ AAA
- `text-secondary (#57534E)` on `bg-primary (#FAFAF9)` = **5.8:1** ✅ AA
- `text-tertiary (#78716C)` on `bg-primary (#FAFAF9)` = **3.9:1** ⚠️ 仅用于非关键信息

---

## 10. 实现指南

### 10.1 Tailwind 配置扩展

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE',
          300: '#A5B4FC', 400: '#818CF8', 500: '#6366F1',
          600: '#4F46E5', 700: '#4338CA', 800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          active: '#4338CA',
        },
        warm: {
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A',
          300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B',
          600: '#D97706', 700: '#B45309', 800: '#92400E',
          900: '#78350F',
          DEFAULT: '#F59E0B',
        },
        clarity: {
          50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4',
          300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6',
          600: '#0D9488', 700: '#0F766E', 800: '#115E59',
          900: '#134E4A',
          DEFAULT: '#14B8A6',
        },
        stone: {
          // Override Tailwind default cold gray → warm stone
          50: '#FAFAF9', 100: '#F5F5F4', 200: '#ECECEA',
          300: '#D6D3D1', 400: '#A8A29E', 500: '#78716C',
          600: '#57534E', 700: '#44403C', 800: '#292524',
          900: '#1C1917', 950: '#0C0A09',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Inter Fallback', 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'sans-serif'],
        display: ['Inter Display', 'Inter', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'raised': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'floating': '0 4px 6px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.04)',
        'modal': '0 0 0 1px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.06)',
        'glow-brand': '0 0 0 3px rgba(99,102,241,0.15)',
        'glow-success': '0 0 0 3px rgba(16,185,129,0.15)',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-heavy': '24px',
      },
      animation: {
        'card-in': 'cardIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-up': 'fadeUp 0.2s ease-out',
        'slide-right': 'slideRight 0.3s cubic-bezier(0.25,0.1,0.25,1)',
        'pop': 'pop 0.2s ease-out',
      },
      keyframes: {
        cardIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(0.85)' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
};
```

### 10.2 CSS 变量：设计 Token 运行时

```css
/* packages/ui/src/styles/tokens.css */
:root {
  /* Neutral */
  --color-bg-primary: #FAFAF9;
  --color-bg-secondary: #F5F5F4;
  --color-bg-tertiary: #ECECEA;
  --color-bg-glass: rgba(250, 250, 249, 0.72);
  --color-border-light: #E7E5E4;
  --color-border: #D6D3D1;
  --color-text-primary: #292524;
  --color-text-secondary: #57534E;
  --color-text-tertiary: #78716C;
  --color-text-inverse: #FAFAF9;

  /* Brand */
  --color-brand: #6366F1;
  --color-brand-hover: #4F46E5;
  --color-brand-active: #4338CA;

  /* Warm */
  --color-warm: #F59E0B;

  /* Clarity */
  --color-clarity: #14B8A6;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #F43F5E;
  --color-info: #0EA5E9;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-2xl: 24px;

  /* Shadows */
  --shadow-raised: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-floating: 0 4px 6px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.04);
  --shadow-modal: 0 0 0 1px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.05), 0 20px 40px rgba(0,0,0,0.06);

  /* Glass */
  --glass-bg: rgba(250, 250, 249, 0.72);
  --glass-blur: 20px;
  --glass-border: rgba(255, 255, 255, 0.6);
}
```

### 10.3 组件文件组织

```
packages/ui/src/                        ← 目标路径（阶段 5+ 提取后）
│                                       ← 阶段 4 实际路径：apps/web/src/components/
├── styles/
│   ├── tokens.css              ← CSS 变量定义
│   └── globals.css             ← 全局重置 + 工具类 (.glass-card 等)
├── components/
│   ├── BentoGrid.tsx
│   ├── BentoCard.tsx
│   ├── GlassCard.tsx
│   ├── GameShell.tsx
│   ├── GameToolbar.tsx
│   ├── GameStatusBar.tsx
│   ├── ProgressiveDisclosure.tsx
│   ├── KnowledgeCard.tsx
│   ├── EducationPanel.tsx
│   ├── SolverVizPanel.tsx
│   ├── NavBar.tsx
│   ├── TabBar.tsx
│   ├── Button.tsx
│   ├── IconButton.tsx
│   ├── Badge.tsx
│   ├── ProgressBar.tsx
│   ├── DifficultyMeter.tsx
│   └── I18nProvider.tsx
├── hooks/
│   ├── useReducedMotion.ts     ← prefers-reduced-motion 检测
│   ├── useKeyboardNav.ts       ← 键盘导航 hook
│   └── useBentoGrid.ts         ← Bento 网格布局计算
├── utils/
│   ├── cn.ts                   ← clsx + tailwind-merge 合并
│   └── breakpoints.ts          ← 响应式断点判断
└── index.ts                    ← 统一导出
```

### 10.4 与架构约束的关系

- **B.4.1 分层架构**：`packages/ui` 中的所有组件**不依赖** Core 层逻辑。它们通过 props 接收数据。GameShell 接收 `GamePlugin.render` 传入的棋盘组件，自身只负责布局容器。
- **B.4.3 渲染后端**：GameShell 的 `renderBackend` prop 决定棋盘区是 `<div ref={domRef}>` 还是 `<canvas ref={canvasRef}>`。游戏模块的 `render.tsx` 据此返回对应实现。
- **ADR-011**：算法可视化（React Flow / D3 / custom SVG）在 `apps/web/src/` 中实现，按 `trace.type` 懒加载匹配的 Viz 组件，挂载到 EducationPanel 侧边栏。
- **ADR-003**：`ProgressiveDisclosure` 组件确保 L1 层（纯游戏）始终是默认渲染状态，L2/L3 从属。

### 10.5 实施顺序（阶段 4 内）

阶段 4 垂直切片（Lights Out）不需要实现全部 UI 组件。按以下优先级分批：

| 批次 | 组件 | 原因 |
|---|---|---|
| **4a 必需** | `Button`, `IconButton`, `GameShell`, `GameToolbar`, `GameStatusBar`, `cn()` | 游戏可玩的最小 UI |
| **4b 必需** | `ProgressiveDisclosure`, `KnowledgeCard` | 验证 L1/L2 切换 |
| **4c 需要** | `EducationPanel`, `tokens.css`, `globals.css` | L3 深度面板 + 样式基础 |
| **4d 需要** | `BentoCard`(仅 `raised` 变体), `Badge` | 面板内容渲染 |
| **5 阶段** | `BentoGrid`, `GlassCard`, `NavBar`, `TabBar` | Hub 首页（有多个游戏入口后） |
| **5 阶段** | `SolverVizPanel` (React Flow / D3) | 算法可视化（求解器就绪后） |
| **6 阶段** | `DifficultyMeter`, `ProgressBar` | 横切能力 |

---

## 📝 变更日志

- [2026-06-26] 初始版本：Playful Bento 设计系统完整定义，含 tokens、布局、组件、动效、响应式、可访问性、实现指南。

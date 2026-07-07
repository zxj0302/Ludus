# EducationPanel 五段卡片化设计

## 目标

将侧边栏五个教学段落（玩/思考/揭示/求解/出题）从纯 Markdown 文本改为独立彩色卡片，提升视觉层次感与可读性。

## 颜色体系

每段分配独立色系，在 `apps/web/src/styles/index.css` 中补充两个新色系变量：

| 段落        | 色系             | 来源 | 情感       |
| ----------- | ---------------- | ---- | ---------- |
| 玩 Play     | `clarity-teal` | 已有 | 轻松、上手 |
| 思考 Think  | `game-amber`   | 已有 | 好奇、悬念 |
| 揭示 Reveal | `logic-indigo` | 已有 | 知识、推导 |
| 求解 Solve  | `sky-blue`     | 新增 | 计算、求解 |
| 出题 Create | `violet`       | 新增 | 创造、设计 |

新增 CSS 变量（参考现有命名规范）：

```css
--sky-blue-50: #f0f7ff;
--sky-blue-100: #d6e8ff;
--sky-blue-200: #a8cfff;
--sky-blue-600: #2b7bd6;
--sky-blue-700: #1d5fa8;

--violet-50: #f7f5ff;
--violet-100: #e7e0ff;
--violet-200: #c9b8ff;
--violet-600: #7847d6;
--violet-700: #5e2fad;
```

## 卡片结构

```
┌──────────────────────────────┐
│ ▌ 🎮  玩 · Play             │  ← 左侧色条(4px) + 图标 + 标题
│                              │
│  [Markdown 渲染的内容]       │  ← 现有 MarkdownRenderer
│                              │
└──────────────────────────────┘
```

- 外层：`bento-card` 白底 + 左侧 4px 圆角色条（用 `border-l-4` + 对应 `border-<color>-500` 类）
- 标题行：emoji 图标 + 中英标题（从 `## ` heading 解析），`text-sm font-semibold`
- 内容区：去掉最外层 `## ` heading（已在卡片标题显示），其余 Markdown 照常渲染
- 卡片间距：`space-y-3`

## 各段 emoji 图标

| 段落   | 图标 | 英文   |
| ------ | ---- | ------ |
| Play   | 🎮   | Play   |
| Think  | 💡   | Think  |
| Reveal | 🔬   | Reveal |
| Solve  | ⚙️ | Solve  |
| Create | 🎨   | Create |

## 实现方案

**方案 A（推荐）**：在 `EducationPanel.tsx` 中按 `## ` 标题拆分 Markdown 字符串，每段单独包成 `SectionCard` 组件渲染。

- `EducationPanel.tsx`：新增 `SectionCard` 子组件 + `splitSections()` 工具函数
- `styles/index.css`：新增两套色系 CSS 变量
- 教育 Markdown 文件：**不改**
- `MarkdownRenderer`：**不改**

## 影响范围

- `apps/web/src/components/EducationPanel.tsx` — 主要改动，拆分段落 + SectionCard
- `apps/web/src/styles/index.css` — 新增 `sky-blue`、`violet` 色系变量
- 不涉及 `packages/` 下任何文件

## 非目标

- 不改动 MarkdownRenderer（保持通用性）
- 不改动教育 Markdown 文件内容
- 不改动顶部 tab 跳转逻辑（scrollToSection 继续工作）
- 不改动 StatusCard / 可视化 / 最优解步骤（它们已经在卡片里）

## 兼容性

- 五段内容根据 Markdown 中 `## N. 中文 · English` 格式解析，若某段缺失则跳过，不影响其余卡片
- 对 RTL 无影响（中文/英文均为 LTR）
- 移动端侧边栏（全屏覆盖）同样受益

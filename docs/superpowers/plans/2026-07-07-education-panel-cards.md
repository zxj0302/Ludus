# EducationPanel 五段卡片化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 EducationPanel 侧边栏中五个教学段落从纯 Markdown 文本改为独立彩色卡片

**Architecture:** 在 EducationPanel.tsx 中新增 `SectionCard` 组件和 `splitSections()` 工具函数，按 `## ` 标题拆分 Markdown 字符串，每段包装为带左侧色条的 bento-card。新增 sky-blue 和 violet 两套 CSS 色系变量。

**Tech Stack:** React + TypeScript + Tailwind CSS + Framer Motion（已有）

## Global Constraints

- 不改动 MarkdownRenderer（保持通用性）
- 不改动教育 Markdown 文件内容
- 不改动顶部 tab 跳转逻辑
- 不改动 StatusCard / 可视化 / 最优解步骤
- 遵循项目现有 CSS 变量命名规范（Tailwind 自定义色系）

---

### Task 1: 新增 CSS 色系变量

**Files:**
- Modify: `apps/web/src/styles/index.css`

**Interfaces:**
- Produces: CSS 变量 `--sky-blue-*` 和 `--violet-*` 系列，供 SectionCard 使用

- [ ] **Step 1: 在 `:root` 中添加两套色系变量**

在 `index.css` 的 `:root` 块中，`--clarity-teal-dark` 之后添加：

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

- [ ] **Step 2: 在 `tailwind.config` 中确认自定义色系已配置或检查是否需要补充**

运行 `grep -r "sky-blue\|violet" /Users/zxj/Desktop/Ludus/tailwind.config.* /Users/zxj/Desktop/Ludus/apps/web/tailwind.config.* 2>/dev/null`，确认是否需要添加。

如果 tailwind config 未定义这些色系，使用内联 `style` 属性或 Tailwind 的 `border-l-4` + 自定义颜色来设置左侧色条、背景色等。

实际上，由于项目可能没有为 sky-blue 和 violet 配置 Tailwind 扩展，Card 的左侧色条将使用内联 `style={{ borderLeftColor: 'var(--xxx)' }}` 方式，背景色使用内联 `style={{ backgroundColor: 'var(--xxx)' }}`。此为降级策略。

- [ ] **Step 3: 验证 CSS 构建**

```bash
cd /Users/zxj/Desktop/Ludus && pnpm --filter ludus-web dev --host 2>&1 | head -5 &
sleep 5
curl -s http://localhost:5174/ | head -20
```

确认 Vite 正常启动无 CSS 编译错误。

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/styles/index.css
git commit -m "feat: add sky-blue and violet CSS color variables for education section cards"
```

---

### Task 2: 实现 SectionCard 组件 + 段落拆分

**Files:**
- Modify: `apps/web/src/components/EducationPanel.tsx`

**Interfaces:**
- Consumes: CSS 变量 `--sky-blue-*`, `--violet-*`（Task 1 产物）
- Produces: `SectionCard` 组件, `splitSections()` 工具函数
- 替换 Markdown 内容渲染区：原来 `<MarkdownRenderer content={bodyMd} />` 替换为按段落拆分的卡片列表

- [ ] **Step 1: 定义段落颜色 + 图标映射**

在 `EducationPanel.tsx` 文件的 `STAGES` 常量后面（第 55 行后），添加：

```typescript
interface SectionStyle {
  icon: string;
  borderColor: string;
  bgColor: string;
  headerColor: string;
}

const SECTION_STYLES: Record<string, SectionStyle> = {
  play:   { icon: '🎮', borderColor: 'var(--clarity-teal-dark)',    bgColor: '#ccfbef', headerColor: 'var(--clarity-teal-dark)' },
  think:  { icon: '💡', borderColor: 'var(--game-amber-400)',       bgColor: 'var(--game-amber-100)',  headerColor: 'var(--game-amber-700)' },
  reveal: { icon: '🔬', borderColor: 'var(--logic-indigo-600)',     bgColor: 'var(--logic-indigo-50)', headerColor: 'var(--logic-indigo-700)' },
  solve:  { icon: '⚙️', borderColor: 'var(--sky-blue-600)',         bgColor: 'var(--sky-blue-50)',     headerColor: 'var(--sky-blue-700)' },
  create: { icon: '🎨', borderColor: 'var(--violet-600)',           bgColor: 'var(--violet-50)',       headerColor: 'var(--violet-700)' },
};
```

- [ ] **Step 2: 实现 `splitSections()`**

紧接上一步后添加：

```typescript
function splitSections(md: string): { key: string; english: string; chinese: string; body: string }[] {
  const sections: { key: string; english: string; chinese: string; body: string }[] = [];
  const parts = md.split(/^## /m);
  const stageMap: Record<string, string> = { play: 'play', think: 'think', reveal: 'reveal', solve: 'solve', create: 'create' };

  for (const part of parts) {
    if (!part.trim()) continue;
    const newlineIdx = part.indexOf('\n');
    const heading = newlineIdx >= 0 ? part.slice(0, newlineIdx).trim() : part.trim();
    const body = newlineIdx >= 0 ? part.slice(newlineIdx + 1).trim() : '';

    // heading format: "1. 玩 · Play" or "2. 思考 · Think"
    const englishPart = heading.includes('·') ? heading.split('·').pop()!.trim() : heading;
    const englishLower = englishPart.toLowerCase();
    const chinesePart = heading.includes('·') ? heading.split('·')[0]!.replace(/^\d+\.\s*/, '').trim() : heading;

    const key = stageMap[englishLower];
    if (key && body) {
      sections.push({ key, english: englishPart, chinese: chinesePart, body });
    }
  }
  return sections;
}
```

- [ ] **Step 3: 实现 `SectionCard` 组件**

紧接上一步后添加：

```typescript
function SectionCard({ section }: { section: { key: string; english: string; chinese: string; body: string } }) {
  const style = SECTION_STYLES[section.key];
  if (!style) return <MarkdownRenderer content={section.body} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bento-card overflow-hidden"
    >
      {/* 标题行 */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-warm-stone-100"
        style={{ borderLeft: `4px solid ${style.borderColor}`, backgroundColor: style.bgColor }}
      >
        <span className="text-base">{style.icon}</span>
        <h3 className="text-sm font-semibold" style={{ color: style.headerColor }}>
          {section.chinese} · {section.english}
        </h3>
      </div>
      {/* 内容 */}
      <div className="px-4 py-3">
        <MarkdownRenderer content={section.body} />
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 4: 替换 Markdown 内容渲染区**

在 `EducationPanel.tsx` 中找到第 257 行附近的：

```tsx
{/* 完整 Markdown 教学内容（所有章节） */}
{bodyMd && <MarkdownRenderer content={bodyMd} />}
```

替换为：

```tsx
{/* 五段式教学卡片 */}
{bodyMd && (() => {
  const sections = splitSections(bodyMd);
  if (sections.length === 0) return <MarkdownRenderer content={bodyMd} />;
  return (
    <div className="space-y-3">
      {sections.map(section => (
        <SectionCard key={section.key} section={section} />
      ))}
    </div>
  );
})()}
```

- [ ] **Step 5: 验证构建**

```bash
cd /Users/zxj/Desktop/Ludus && pnpm typecheck
```

确认无 TypeScript 错误。

- [ ] **Step 6: 启动 Dev Server 手动验证**

```bash
cd /Users/zxj/Desktop/Ludus && pnpm dev
```

打开 `http://localhost:5174/game/lights-out`，打开侧边栏，确认：
- 五个段落各为独立卡片
- 左侧色条颜色正确
- 图标显示正确
- 内容正常渲染
- 滚动到各段落功能正常（顶部 tab 跳转）
- 切换 L2/L3 后卡片更新
- 切换语言后卡片更新

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/EducationPanel.tsx
git commit -m "feat: wrap education sections in colored cards with icons and left border accents"
```

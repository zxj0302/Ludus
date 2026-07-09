---
name: Ludus 开发经验总结
description: 从 Lights Out 端到端样板及 8 款游戏、架构重构中积累的坑、惯例、偏好——后续游戏开发必读
type: reference
originSessionId: 2e40e0e3-e977-4b67-8ad6-d599f64981a9
---
# Ludus 开发经验总结 — 后续游戏开发参考

> 从阶段 4（Lights Out）到阶段 8 款游戏及 ADR-023 架构重构、阶段 6–7 横切能力中积累的教训、惯例与偏好。
> 新游戏的开发者应在动工前通读本文。

---

## 1. 架构与文件组织

### 1.1 类型定义归于各游戏目录

Post ADR-023，每款游戏自包含 `types.ts`（如 `LightsOutState`/`LightsOutMove`）。Core 层只保留通用的 `GameState`/`Move` 类型别名和 `GamePlugin` 接口。**不要**在 Core 层定义游戏专属类型。

### 1.2 求解器/生成器/难度均归游戏目录

Post ADR-023，solver.ts / generator.ts / difficulty.ts 全部在各游戏目录下。Core 不再包含 `solver/`、`generator/`、`difficulty/` 子目录。即使两个游戏的算法相似（如 Nim XOR、Wythoff Beatty），也各自独立实现——策略重合度不足以为"通用框架"提供理由。

### 1.3 Plugin 接口的使用模式

- `getDifficulty(state)` 需要能求解当前状态→ 需要在函数内部 import solver
- `Difficulty` 的 `factors` 字段用 snake_case key（如 `optimalSteps`、`onCells`）
- `labelKey` 统一用 `difficulty.xxx` 格式，对应 i18n key
- `Solution.stats.timeMs` 设为 `-1` 表示"由外层 measure 覆盖"

---

## 2. i18n 铁律

### 2.1 零硬编码原则

**任何面向用户的字符串必须走 `t()` 调用**。没有例外。包括：
- 按钮文字、标签、提示
- 状态栏统计标签（"Steps"、"Optimal"、"Time"）
- 矩阵可视化的 tab 名、阶段标签、图例
- 棋盘状态卡片标题
- Worker 返回的描述字符串（用语言中立的技术英文）
- SoundToggle 的 `title` 属性

### 2.2 元数据也用 i18n key

`GameMetadata` 中以下字段必须是 i18n key（不是显示文字）：
- `nameKey`: `'game.xxx.name'`
- `descriptionKey`: `'game.xxx.description'`
- `category`: `'category.xxx'`（不是 `'线性代数'`）
- `icon`: emoji 字符串（语言无关）

### 2.3 新增翻译 key 的流程

1. 先在 `zh-CN.ts` 和 `en.ts` 中同时添加 key
2. 确保两边 key 完全一致（包括 `{{param}}` 占位符）
3. 再在组件中使用 `t('key')`
4. **不要**先用硬编码文字，之后再补翻译（99% 会忘记）

### 2.4 翻译 key 命名约定

```
app.xxx           — 全局（标题、导航、音效）
game.xxx          — 通用游戏（loading、toolbar、status、board）
game.{id}.xxx     — 特定游戏
disclosure.xxx    — 渐进式揭示
education.xxx     — 教学面板
matrix.xxx        — 矩阵可视化
difficulty.xxx    — 难度标签
category.xxx      — 游戏分类
hub.xxx           — Hub 页面
```

---

## 3. 性能与动画

### 3.1 动画规则

| 规则 | 原因 |
|------|------|
| **禁止 `transition-all`** | 会对所有属性做动画，包括触发布局的 width/height |
| **禁止 CSS transition on `width`/`height`** | 每帧触发 reflow |
| **用 `transform: translateX/Y` 代替 position 动画** | GPU 合成，零 reflow |
| **用 `opacity` 配合 transform** | GPU 合成 |
| **Framer Motion `x`/`y` 比 CSS transition 更可控** | 支持 spring、gesture、layout 等 |

### 3.2 侧边栏动画模式（已验证）

```
外层容器：瞬时 class 切换（w-0 ↔ w-[40%]）控制布局占位
内层 motion.div：animate={{ x, opacity }} 控制视觉动画
                   ↑ translateX（GPU）+ opacity（GPU）
```

### 3.3 保持重组件挂载（Latch Pattern）

```tsx
const [hasBeenOpened, setHasBeenOpened] = useState(false);
useEffect(() => { if (open) setHasBeenOpened(true); }, [open]);

// 替换 if (!open) return null
if (!open && !hasBeenOpened) return null;
```

适用场景：包含 MarkdownRenderer / MatrixViz / 大量 DOM 的面板。
首次打开后永不卸载，避免动画期间的 mount 开销。

---

## 4. 常见 Bug 模式

### 4.1 JS 零值陷阱

```ts
// ❌ 错：0 是 falsy
const moveFactor = optimalSteps ? Math.min(optimalSteps / 30, 1) : 0.5;

// ✅ 对：显式检查 null/undefined
const moveFactor = optimalSteps != null ? Math.min(optimalSteps / 30, 1) : 0.5;
```

**规则**：对 number 类型的判断，永远用 `!= null` 而不是 truthy 检查。

### 4.2 `pcol !== null && pcol !== undefined` → `pcol != null`

JS 中 `!= null` 同时排除 `null` 和 `undefined`。不需要写两遍。

### 4.3 Markdown 表格解析 × LaTeX

`split('|')` 会错误拆分 `$\|\mathbf{x}\|_0$` 中的 `\|`（范数符号）。

**修复模式**：在 split 前用占位符保护 `$...$` / `$$...$$` 区间，split 后还原。

### 4.4 Tailwind 不存在的 class

- `border-l-3` → 只有 `border-l-0/2/4/8`
- `border-l-1` → 也不存在

**规则**：Tailwind 的 border width 只支持 0, 2, 4, 8。

### 4.5 `uniqueSolution` 字段语义

```ts
// ❌ 错：降级后永远为 true，失去信息量
uniqueSolution: unique || !requireUnique,

// ✅ 对：如实报告数学属性
uniqueSolution: unique,
```

**规则**：字段应报告实际状态，不是配置意图。

---

## 5. 测试约定

### 5.1 测试描述必须事实正确

```ts
// ❌ 错
it('always solvable for 5×5 (invertible matrix)')  // 5×5 不 invertible

// ✅ 对
it('always solvable for 5×5 by construction')
```

### 5.2 难度测试要适配公式

难度公式变化时，测试期望值也要同步更新。不要写松散的 `toBeLessThanOrEqual(30)`——如果公式改变了但测试仍过，测试就失去了意义。更好的做法是测试具体的 score 值：

```ts
expect(d.score).toBe(0);  // 精确值，公式变化时测试会失败提醒你
```

### 5.3 测试文件约定

- 与源文件同目录，`.test.ts` 后缀
- 使用 `vitest` 的 `describe`/`it`/`expect`
- 测试数据用**构造法**生成（保证可解），不用随机

---

## 6. Worker 约定

### 6.1 Worker 描述用技术英文

Worker 返回的 trace description 在 UI 中展示，但不应硬编码中文或走 i18n（Worker 无法访问 i18n）。

**用语言中立的技术英文**：
```ts
description: `GF(2) elimination complete — ${n}×${n}, rank=${rank}, nullity=${nullity}`
```

### 6.2 Worker 也要测量时间

```ts
const t0 = performance.now();
// ... computation ...
timeMs: Math.round(performance.now() - t0),
```

### 6.3 Worker 分流（已实现）

`gameStore` 通过 `usesWebWorker(plugin)` 读取 `plugin.metadata.webWorker`，对 Lights Out / Fifteen / Sokoban 走 `runSolverOffThread`（Worker 或 setTimeout fallback）。`requestSolve` 与 `requestHint` 均走同一路径。新游戏若求解耗时，在 manifest 声明 `webWorker: true` 并实现 Worker handler 即可。

---

## 7. 难度系统设计

### 7.1 两个难度函数的职责

| 函数 | 位置 | 输入 | 用途 |
|------|------|------|------|
| `computeDifficulty` | generator | 生成参数（n, moveCount, optimal） | 设置关卡的静态难度 |
| `getDifficulty` | rules | 当前状态 | 实时评估状态难度 |

### 7.2 公式一致性

两个函数**必须使用相同的公式体系**。如果 generator 用"尺寸+步数+最优比"，rules 就不能只用"亮灯比例"。

### 7.3 边缘情况

- `optimalSteps === 0`（已解状态）→ 强制 score = 0，label = easy
- `optimalSteps` 可能为 `null`（无解状态）→ `moveFactor` 使用默认值 0.5

---

## 8. 开发流程偏好

### 8.1 增量交付

- 一次只改一个关注点
- 每个改动后跑 typecheck + tests
- 不改与当前任务无关的代码

### 8.2 文档同步

- 代码改动后立即更新 PROGRESS.md
- 重大决策追加到 DECISIONS.md（ADR 格式）
- 不要创建不必要的 .md 文件（不主动写 README、plan、analysis）

### 8.3 修复优先序

1. 事实性错误（文档/注释/测试描述与代码不符）
2. Bug（运行时行为错误）
3. 设计不一致（两个东西做同一件事用不同方式）
4. 性能（卡顿/不必要的重渲染）
5. 文档格式/措辞

---

## 9. 下次开发新游戏时的检查清单

- [ ] `GamePluginEntry` 导出（BoardComponent / isOwnState / moveToHighlight / i18n / education / 可选 ui.statusCard / 可选 ai / 可选 visualization）
- [ ] solver 纯 TS、框架无关、带 trace（可视化在 `entrySetup.tsx` 注入，按 `trace.type` 匹配）
- [ ] generator 构造法优先，保可解 + 验证唯一/最优
- [ ] `GameMetadata` 所有字段齐备（含 `icon`、i18n key 化、`webWorker` 若需离线程求解）
- [ ] i18n key 中英双份（各游戏 `i18n.ts` 或 manifest）
- [ ] 五段式教学内容 L2/L3 × zh/en（4 个 .md，放在 `packages/education/src/content/<game>/`）
- [ ] registry 注册 + `getGameEntry()`
- [ ] **`entrySetup.tsx` 一个区块**：education `?raw`、viz lazy 组件、toolbar（通用 `GeneratorToolbar` 或专属如 Sokoban）
- [ ] 可选 `education-ui.tsx`：`formatEducationMove` + `ui.statusCard`
- [ ] 单元测试：求解器 + 生成器 + 规则；`load-smoke.test.ts` 冒烟
- [ ] 所有字符串走 `t()`，无硬编码
- [ ] 动画用 `transform`/`opacity`，不用 `width` transition
- [ ] 重面板用 latch pattern 保持挂载
- [ ] `getDifficulty` 与 `computeDifficulty` 公式一致

# 教育面板「出题」生成器控制台设计

## 背景

阶段 6c 的目标是把「关卡设计单元」从纯说明推进到可交互体验：用户通过参数控制关卡生成，并立即游玩/观察生成结果。

本阶段不做「用户写代码设计关卡」。代码式关卡编辑器、插件 SDK、Solver Playground 属于后续 L3 高级能力。

## 目标

- 在教育面板的「出题 / Create」段提供生成器入口。
- 复用现有 `DifficultySelector` 与 `gameStore.newLevel()`，保持与顶部工具栏一致。
- 让用户在阅读出题原理时可以直接选择难度并生成新关卡。
- 保持 L1 无负担：控件只出现在教育面板内，不打断棋盘默认玩法。

## 非目标

- 不新增每游戏高级参数表单（尺寸、种子、唯一解、目标步数等）。
- 不扩展 `GamePlugin` / `GamePluginEntry` 接口。
- 不修改教育 Markdown 内容结构。
- 不支持用户编写代码、脚本或自定义插件。

## 设计方案

在 `EducationPanel.tsx` 的 `SectionCard` 中识别 `section.key === 'create'`，在该卡片内容顶部渲染一个轻量 `CreateLevelControl`。

`CreateLevelControl` 读取 `gameStore.difficultyRange`，调用 `setDifficultyRange()` 与 `newLevel()`；UI 复用 `@ludus/ui` 的 `DifficultySelector`。

控件结构：

```text
┌──────────────────────────────┐
│ 🎨 出题 · Create             │
├──────────────────────────────┤
│ 难度: [简单/中等/困难/随机]  │
│ [+ 新关卡]                   │
├──────────────────────────────┤
│ Markdown 出题说明            │
└──────────────────────────────┘
```

## 数据流

1. 用户在「出题」卡片选择难度 preset。
2. `DifficultySelector` 输出 `[min, max]` 难度区间。
3. `EducationPanel` 调用 `setDifficultyRange(range)`。
4. 随后调用 `newLevel()`，由现有 `generatePlayableState(plugin, difficultyRange)` 生成关卡。
5. 棋盘、状态卡片、进度存档沿用现有 store 流程更新。

## 错误处理

沿用现有生成器 fallback：

- `plugin.generateLevel(config)` 成功：使用生成关卡。
- 失败：`generatePlayableState()` 回退到 `plugin.initialState()`。

第一版不在面板内新增错误提示，避免重复状态通道。

## 测试

- 新增纯函数或组件层测试，确认 `create` 段会显示生成器控件。
- 现有 `DifficultySelector` 测试继续覆盖 preset/range 映射。
- 跑 `pnpm typecheck`、`pnpm test:run`、必要时 `pnpm build:shell`。

## 后续扩展

- 每游戏参数 schema：尺寸、唯一解、目标步数、种子等。
- 展示生成器保证机制：可解性、唯一解、最优解已知、难度可控。
- L3 Solver Playground：显示生成器伪代码、允许调参对比统计。

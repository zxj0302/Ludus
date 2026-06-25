/**
 * ContentRenderer — 渐进式揭示容器组件
 *
 * 负责按 L1/L2/L3 层级渲染教学内容。
 * L1: 仅游戏本体（ContentRenderer 不渲染任何内容）
 * L2: 通关后知识卡片（§2 Think + §3 Reveal 摘要 + §4 Solve 演示）
 * L3: 完整教学文档（§3 完整推导 + §4 伪代码 + §5 Create）
 */

import type { SolverTrace } from '@ludus/core/types';
import type { EducationContent } from '@ludus/core/schemas';

// ---- Props ----

export interface ContentRendererProps {
  /** 已解析的教学内容 */
  content: EducationContent;
  /** 当前可见深度 */
  visibleDepth: 'L1' | 'L2' | 'L3';
  /** 切换到更深层 */
  onReveal: (depth: 'L2' | 'L3') => void;
  /** 求解器步骤轨迹（§4 可视化消费） */
  solverTrace?: SolverTrace;
  /** 当前语言 */
  locale: 'zh-CN' | 'en';
}

// ---- 组件骨架 ----
// 阶段 4（垂直切片）中实现完整渲染逻辑。

export function ContentRenderer(_props: ContentRendererProps): JSX.Element | null {
  // TODO: 阶段 4 实现
  // 1. visibleDepth === 'L1' → return null（不渲染任何教育内容）
  // 2. visibleDepth === 'L2' → 渲染 L2 知识卡片：
  //    - §2 Think（hook question）
  //    - §3 Reveal（formalDefinition + complexityClass，摘要形式）
  //    - §4 Solve 求解器演示（solverTrace → React Flow/D3 动画）
  //    - "深入学习" 按钮 → onReveal('L3')
  //    - "关闭" 按钮 → onReveal('L1')
  // 3. visibleDepth === 'L3' → 渲染完整 L3 文档：
  //    - 类教材排版，含目录（TOC）
  //    - §3 完整 formalDefinition + complexityJustification（KaTeX 渲染）
  //    - §4 algorithmDescription + pseudocode（语法高亮）+ complexityAnalysis
  //    - §5 generationStrategy + difficultyFactors
  //    - "收起" 按钮 → onReveal('L2')
  //    - "关闭" 按钮 → onReveal('L1')
  return null;
}

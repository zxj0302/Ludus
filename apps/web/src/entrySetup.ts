// Web 层入口配置 — 为游戏 entry 注入 web 专属 UI 扩展
// 在 main.tsx 中尽早 import 以确保工具栏等组件就绪

import { sokobanEntry } from '@ludus/games';
import { SokobanToolbar } from './components/SokobanToolbar';

// Sokoban 关卡选择器（依赖 web 专属的 useSokobanLevels hook）
sokobanEntry.ui = {
  ...sokobanEntry.ui,
  toolbarSlot: SokobanToolbar as any,
};

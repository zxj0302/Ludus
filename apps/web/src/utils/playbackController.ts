// 统一管理所有 setTimeout，确保切换游戏/重置时可全部取消

const activeTimers = new Set<ReturnType<typeof setTimeout>>();

export function scheduleTimeout(fn: () => void, ms: number): ReturnType<typeof setTimeout> {
  const id = setTimeout(() => {
    activeTimers.delete(id);
    fn();
  }, ms);
  activeTimers.add(id);
  return id;
}

export function clearAllPlaybackTimers(): void {
  for (const id of activeTimers) clearTimeout(id);
  activeTimers.clear();
}

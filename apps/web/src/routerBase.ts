export function resolveRouterBasename(baseUrl: string): string | undefined {
  if (!baseUrl.startsWith('/')) return undefined;
  return baseUrl.replace(/\/$/, '') || undefined;
}

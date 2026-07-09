# Ludus Mobile (Capacitor 6)

WebView 套壳，复用 `apps/web` 构建产物。

## 前置依赖

- Node 20+ / pnpm 9+
- Android：`Android Studio` + SDK（仅打包 Android 时需要）
- iOS：Xcode（仅 macOS 打包 iOS 时需要）

## 首次初始化

```bash
pnpm install
pnpm build:shell

cd apps/mobile
pnpm add:android   # 或 pnpm add:ios（macOS）
pnpm sync
```

## 日常同步 Web 资源

从仓库根目录：

```bash
pnpm sync:mobile
```

将 `apps/web/dist` 复制到原生工程的 `webDir`。

## 打开 IDE

```bash
cd apps/mobile
pnpm open:android
# 或 pnpm open:ios
```

## 架构关系

| 层 | 路径 |
|----|------|
| React 应用 | `apps/web` |
| Capacitor 配置 | `apps/mobile/capacitor.config.ts` |
| 前端产物 | `webDir: ../web/dist` |

`android/` 与 `ios/` 目录由 `cap add` 生成，已加入 `.gitignore`。

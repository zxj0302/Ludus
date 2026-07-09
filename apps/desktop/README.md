# Ludus Desktop (Tauri 2)

WebView 套壳，复用 `apps/web` 构建产物，零 React 重写。

## 前置依赖

- [Rust](https://rustup.rs/)（含 `cargo`）
- Windows：WebView2（Win10+ 通常已预装）
- Node 20+ / pnpm 9+

## 开发

从仓库根目录：

```bash
pnpm install
pnpm dev:desktop
```

会先启动 `ludus-web` Vite 开发服（`:5173`），再打开 Tauri 窗口。

## 生产构建

```bash
# 首次需生成图标（仅需一次）
cd apps/desktop
pnpm exec tauri icon icon.svg

# 从根目录
pnpm build:shell    # web 相对路径构建
pnpm build:desktop  # 打包桌面安装包
```

`build:shell` 使用 Vite `--mode shell`，将 `base` 设为 `./`，供 WebView 正确加载静态资源。

## 架构关系

| 层 | 路径 |
|----|------|
| React 应用 | `apps/web` |
| 套壳配置 | `apps/desktop/src-tauri/tauri.conf.json` |
| 前端产物 | `apps/web/dist` → `frontendDist: ../../web/dist` |

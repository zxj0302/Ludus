# 阶段 6d — 跨平台套壳可行性验证

> **角色**：DevOps / 系统架构师  
> **状态**：✅ 配置与构建链路已落地；原生打包需本机工具链  
> **关联 ADR**：ADR-009（平台优先级）、ADR-010（Tauri + Capacitor）

## 目标

验证 **Web 首发代码库** 可在不重写 React 的前提下，经 Tauri（桌面）与 Capacitor（移动）套壳分发。

## 交付物

| 工件 | 路径 |
|------|------|
| Web 套壳构建模式 | `apps/web` — `pnpm build:shell`（`base: './'`） |
| Tauri 桌面壳 | `apps/desktop/` |
| Capacitor 移动壳 | `apps/mobile/` |
| 配置冒烟测试 | `apps/web/src/shellPackaging.test.ts` |

## 架构验证结论

```
apps/web (React + Vite)
    │
    ├── build        → dist/          （Web 部署，base=/）
    ├── build:shell  → dist/          （套壳嵌入，base=./）
    │
    ├── apps/desktop (Tauri 2)
    │     frontendDist → ../../web/dist
    │     devUrl       → http://127.0.0.1:5173
    │
    └── apps/mobile (Capacitor 6)
          webDir → ../web/dist
```

**结论**：分层架构满足 ADR-010「三端复用同一 React 代码库」约束；Core / games 层无需改动。

## 平台 × 能力（套壳后）

| 能力 | Web | Tauri 桌面 | Capacitor 移动 |
|------|-----|------------|----------------|
| 可玩 | ✅ | ✅ 同 WebView | ✅ 同 WebView |
| 求解器 | ✅ Worker | ✅ 同 Web | ⚠️ iOS Worker 内存受限（已有纯 TS 回退） |
| localStorage 进度 | ✅ | ✅ | ✅ |
| 路由 (BrowserRouter) | ✅ | ✅ Tauri 自定义协议 | ✅ `androidScheme: https` |

## 本机验证步骤

### 0. 工具链

- **Rust**：`rustup update stable`（需 ≥ 1.85，见 `apps/desktop/rust-toolchain.toml`）
- **Tauri 图标**（首次打包）：`cd apps/desktop && pnpm exec tauri icon icon.svg`

### 1. 套壳 Web 构建

```bash
pnpm build:shell
# 检查 dist/index.html 中脚本为 ./assets/... 而非 /assets/...
```

### 2. Tauri 开发模式

```bash
pnpm dev:desktop
# 预期：Vite :5173 + 桌面窗口，Hub 与游戏可玩
```

### 3. Tauri 生产包（需 Rust）

```bash
cd apps/desktop && pnpm exec tauri icon icon.svg   # 首次
pnpm build:desktop
```

### 4. Capacitor 同步（需 cap add 一次）

```bash
pnpm build:shell
cd apps/mobile && pnpm add:android && pnpm sync
pnpm open:android
```

## 已知限制（非阻塞）

- Tauri 首次 `build` 需 Rust 工具链 + 图标生成
- Capacitor `android/` / `ios/` 不纳入 git（`.gitignore`），由 `cap add` 本地生成
- 微信小程序不在本阶段范围（ADR-009）

## 下一步（阶段 7 / 后续）

- CI 矩阵：Web build + `pnpm validate:shell`（套壳构建 + 配置/产物契约测试）✅
- PWA Service Worker（Web 离线）
- Tauri 插件：系统通知、文件导出关卡

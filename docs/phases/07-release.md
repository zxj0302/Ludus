# 阶段 7 — 测试 / 发布

> 角色：DevOps / QA / 技术文档  
> 状态：✅ v0.2.0 审计硬化版已发布

## 目标

- 可重复的 CI 验证链路
- 本机 / 桌面可玩（不依赖公开 Pages）
- tagged release + 桌面安装包

## 已完成

| 工件 | 说明 |
|------|------|
| CI | `.github/workflows/ci.yml` — typecheck、425 测试、web 构建、`pnpm validate:shell` |
| 桌面开发壳 | `pnpm dev:desktop` 本机验证通过 |
| 桌面生产构建 | `pnpm build:desktop` 产出 `.msi` + `-setup.exe`（Rust ≥ 1.85） |
| CHANGELOG | `CHANGELOG.md` v0.2.0 |
| CONTRIBUTING | `CONTRIBUTING.md` |
| Release workflow | `.github/workflows/release.yml` — tag `v*` 触发 Windows 打包 |
| 套壳模拟验证 | `pnpm validate:shell` — 无 Android SDK 亦可验证 Tauri/Capacitor 链路 |

## 刻意不做（v0.2.x）

- **公开 GitHub Pages**：个人账号不支持私有可见性
- **移动端商店发布**：Capacitor 配置 + `validate:shell`；真机验证暂缓
- **性能基准套件**：留待后续

## 发布步骤

1. 确认 CI 绿灯：`https://github.com/zxj0302/Ludus/actions`
2. 本地冒烟（可选）：
   ```bash
   pnpm test:run
   pnpm validate:shell
   pnpm build:desktop
   ```
3. 同步版本号至所有 `package.json`、`tauri.conf.json`、`Cargo.toml`（`shellPackaging.test.ts` 会校验）
4. 打 tag 并推送（触发 Release workflow）：
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
5. 在 GitHub **Releases** 页查看自动上传的 Windows 安装包
6. 本机安装测试：`Ludus_*_x64-setup.exe` 或 `.msi`

## 产物路径（本地）

```
apps/desktop/src-tauri/target/release/bundle/
├── nsis/Ludus_0.2.0_x64-setup.exe
└── msi/Ludus_0.2.0_x64_en-US.msi
```

## 下一步

1. **增量新游戏**（backlog 候选：Connect 4、Peg Solitaire、Slitherlink）
2. 横切：PWA、成就 UI、Sokoban 程序化生成器
3. 移动端真机验证（配置 Android SDK 后）

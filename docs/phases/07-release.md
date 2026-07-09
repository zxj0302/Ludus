# 阶段 7 — 测试 / 发布

> 角色：DevOps / QA / 技术文档  
> 状态：✅ v0.1.1 Windows 修复版已发布

## 目标

- 可重复的 CI 验证链路
- 本机 / 桌面可玩（不依赖公开 Pages）
- 首个 tagged release + 桌面安装包

## 已完成

| 工件 | 说明 |
|------|------|
| CI | `.github/workflows/ci.yml` — typecheck、387 测试、web/shell 构建 |
| 桌面开发壳 | `pnpm dev:desktop` 本机验证通过 |
| 桌面生产构建 | `pnpm build:desktop` 产出 `.msi` + `-setup.exe`（Rust ≥ 1.85） |
| CHANGELOG | `CHANGELOG.md` v0.1.1 |
| CONTRIBUTING | `CONTRIBUTING.md` |
| Release workflow | `.github/workflows/release.yml` — tag `v*` 触发 Windows 打包 |

## 刻意不做（v0.1.x）

- **公开 GitHub Pages**：个人账号不支持私有可见性，已关闭 deploy job
- **移动端商店发布**：仅 Capacitor 配置骨架
- **性能基准套件**：留待后续

## 发布步骤

1. 确认 CI 绿灯：`https://github.com/zxj0302/Ludus/actions`
2. 本地冒烟（可选）：
   ```bash
   pnpm test:run
   pnpm build:desktop
   ```
3. 打 tag 并推送（触发 Release workflow）：
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```
4. 在 GitHub **Releases** 页查看自动上传的 Windows 安装包
5. 本机安装测试：`Ludus_*_x64-setup.exe` 或 `.msi`

## 产物路径（本地）

```
apps/desktop/src-tauri/target/release/bundle/
├── nsis/Ludus_0.1.1_x64-setup.exe
└── msi/Ludus_0.1.1_x64_en-US.msi
```

## 下一步（阶段 7 续）

1. 手动下载验证 `v0.1.1` Windows 安装包不再空白
2. 移动端 `pnpm sync:mobile` + 真机验证
3. 性能基准 / 首屏包体积监控（可选）
4. 阶段 6c 续：教育面板「出题」高级参数

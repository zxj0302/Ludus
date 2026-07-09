# Contributing to Ludus

感谢有兴趣参与 Ludus！本项目遵循**增量交付**：一次只推进一个明确工件，合并前须保持测试与类型检查通过。

## 开始前必读

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | 会话协议与项目宪法（分层架构、DoD、交付规则） |
| `docs/PROGRESS.md` | 进度唯一真相源 — 当前阶段与下一步 |
| `docs/DECISIONS.md` | 已确认 ADR，勿与既定决策冲突 |
| `docs/lessons-learned.md` | 多游戏开发经验与检查清单 |

## 环境要求

- Node.js ≥ 20
- pnpm ≥ 9（推荐 `corepack enable`）
- 桌面构建额外需要 Rust ≥ 1.85（见 `apps/desktop/rust-toolchain.toml`）

```bash
pnpm install
pnpm dev          # Web 开发 http://127.0.0.1:5173
pnpm test:run     # 384 测试
pnpm typecheck
pnpm build        # Web 生产构建
```

## 新增游戏（概要）

1. 在 `packages/games/src/<game-id>/` 自包含实现（rules/solver/generator/render/manifest…）
2. 注册到 `packages/games/src/registry.ts`
3. 在 `apps/web/src/entrySetup.tsx` 添加教育内容、可视化、toolbar 区块
4. 补充 `packages/education/src/content/<game-id>/` 四份 markdown
5. 单元测试 + `load-smoke.test.ts` 冒烟

完整 DoD 见 `CLAUDE.md` B.7。

## 提交前检查

```bash
pnpm typecheck
pnpm test:run
pnpm build:shell   # 若改动影响套壳构建
```

CI 在 push / PR 时自动运行（`.github/workflows/ci.yml`）。

## 发布

见 `docs/phases/07-release.md`。桌面安装包通过打 tag `v*` 触发 Release workflow。

## 许可

贡献即表示同意以 [MIT](LICENSE) 许可发布。

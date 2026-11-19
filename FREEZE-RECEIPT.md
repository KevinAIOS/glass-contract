# 冻结回执：@aios/glass-contract 协议 v1

| 项 | 值 |
|---|---|
| 仓库 | `KevinAIOS/AIOSGlass`（私有） |
| 分支 | `codex/kele-20261103` |
| 提交 SHA | `d5a93a371b3d825b87771ab517c435551948a547` |
| 原路径 | `aios/packages/glass-contract` |
| npm 包名 / 版本 | `@aios/glass-contract` / `0.1.0`（`private: true`，未改） |
| 协议版本 | **v1**（`schema_version: 1`） |
| 冻结日期 | **2026-11-19 ET（America/New_York，EST，UTC-5）**；构建与测试于 06:16 EST（11:16 UTC）完成 |
| 源快照 | `/workspace/oss/_freeze-src/glass-contract/`（据交付说明，字节已与 GitHub 上该提交的 size 核对；本次未再访问 GitHub） |
| 工具链 | bun 1.4.4、Node v24.22.1、typescript 7.0.2（devDependency，精确锁定）、zod 3.25.76 |
| 对外动作 | 无：没有 publish、push、PR、remote、新建仓库，也没有邀请任何人 |

## 1. 计数（从 src/schemas.ts 实际数出）

两种方法独立计数，结果一致：

1. **运行时**：`bun -e` 导入 `src/schemas.ts`，取 `Object.keys(CommandPayloadSchemas).length` 等
   → `{"commands":50,"events":25,"capabilities":17,"permissions":12,"errorCodes":17}`
2. **静态文本**：awk 统计 `export const CommandPayloadSchemas` / `EventPayloadSchemas` 到 `} as const` 之间、以两个空格加 `"aios.` 开头的键行
   → `static commands=50, events=25`

| | 数量 | 核对 |
|---|---|---|
| 命令 | 50 | ✅ = 50 |
| 事件 | 25 | ✅ = 25 |
| 操作合计 | 75 | ✅ = 75 |
| `CapabilityId` | 17 | 枚举，不另算接口 |
| `PermissionId` | 12 | 枚举，不另算接口 |

另外，`test/contract.test.ts` 的 "registries cover every command, event and capability" 断言 fixtures 与 `COMMAND_CAPABILITIES` 的键恰为 50 条命令、`EVENT_CAPABILITIES` 的键恰为 25 个事件，且两者的值覆盖全部 17 个能力，该测试通过。

## 2. 文件清单

### 2.1 冻结快照文件（sha256；与 `_freeze-src` 比对）

| 文件 | 字节 | sha256 | 与快照比 |
|---|---|---|---|
| `.gitignore` | 21 | `d91ca4f59bac6955e2d50b7e16c9300174d33ddf0c554148e52e1ee8b46d89ab` | 相同 |
| `package.json` | 快照 385 → 现 529 | 快照 `348bef19cddeb40f6d8cee18b78714caed9dbe8833cb35e9f9f347e0b1f300a8` → 现 `1a2efdd8939d9fa9891a561dd426b30f255749b4c3976e6d068e4e825fbdab46` | **已改（仅构建配置，见 2.2）** |
| `src/app-data.ts` | 5779 | `316fa857e7aec08c56c08be70a23561f28c88d595858f0204d51350c8f2e8795` | 相同 |
| `src/catalog-client.ts` | 5782 | `cebc223ffe9bc7eb1ec04f12baae28019b0c5a930c3d6e815d09a25c49ea1928` | 相同 |
| `src/catalog.ts` | 5148 | `31496fae694fecd5fd9a4972d8b394358da550812a7846cea04b7e987ecfada6` | 相同 |
| `src/core.ts` | 4589 | `f015fba49840827abde5d1197605b6a382749433292f224e92a2c1917d1b32db` | 相同 |
| `src/index.ts` | 114 | `f6cbdd4fbf52bb7a435c470de0754b5d0b0cb2ef8778711607a0c5d1ce8c0383` | 相同 |
| `src/look-timing.ts` | 249 | `2037556cfeb8617485849944ea6d5d3ac4816374c042fc3ed3ab999dc415be87` | 相同 |
| `src/media-state.ts` | 1789 | `369c1808bd0e67640a79adc2434f12b47e6b228be8ca232df1d76e4451e2ffb9` | 相同 |
| `src/network-policy.ts` | 597 | `6247f0a3ecb360949871720edca8198d1cf5dba8ae895d8a85fc1b3e04897a2a` | 相同 |
| `src/packages.ts` | 2287 | `216e4e4377282954d1b32155783abc58cf322a4d967318d617967a1f26765f35` | 相同 |
| `src/schemas.ts` | 15639 | `31ac8ba9fa2b589d82e80f3dec5ad94f7662e2221acdccdcbecb9f600d71be49` | 相同 |
| `test/adapter.test.ts` | 16870 | `133dfe212a2647fd1c1ec666e041b50e4c42b6321bf939046a88bb79c6741be3` | 相同 |
| `test/boundary.test.ts` | 2492 | `83f24c9a60b03ed564a5822150d9ffca18e3f4bac4ad3c83d963b7660e0a9632` | 相同 |
| `test/consumer.ts` | 775 | `e580f3b75b9f692826dea7bdf098a01cb0c4a1d60c0aeadfafe0c698c31e6f1e` | 相同 |
| `test/contract.test.ts` | 7369 | `42d915ec576da2c4fdc8d87db861163ec17078f2b023259aa9a357e12c18ac61` | 相同 |
| `test/fixtures.ts` | 3075 | `7f187005e0974140e7263f5a82cc67ffeddd77efc16009b8e912427d5beee3d8` | 相同 |
| `tsconfig.json` | 快照 302 → 现 301 | 快照 `3cf5f1e00d5d11c0ea1ec99538a8d223b787f437fa1a3d0b5226921bac6c820a` → 现 `5dfdd716b30c8b979391d30f19293d56e0a727d2e1c49971b3607a0a377d4335` | **已改（仅构建配置，见 2.2）** |

`src/`（10 个文件）和 `test/`（5 个文件）以及 `.gitignore` 的字节与快照完全相同。契约逻辑、操作表和 schema 都没有改动。

### 2.2 构建配置改动（完整 diff 见 `freeze-evidence/00-config-diff.patch`）

- `package.json`：新增 `devDependencies.typescript: "7.0.2"`，因为原 build 脚本调用 `tsc`，但原包没有声明 typescript；新增 `scripts.test:standalone`；`"files": ["dist"]` 被 JSON 序列化成了多行格式。`name`、`version: 0.1.0`、`private: true`、`license`、`exports`、`dependencies` 都没变。
- `tsconfig.json`：`"include": ["src/**/*.ts"]` 改成 `"files": ["src/index.ts"]`，其余 compilerOptions 不变。**原因：** 照原样构建会失败，因为 `src/app-data.ts` import 包外的 `../../glass/overrides/ui/data`（TS2307），`src/catalog-client.ts` 需要 Node 的 `buffer` 类型（TS2591），而原配置是 `types: []`。这两个文件都不在 `src/index.ts` 的导出图里。把构建范围收窄到公开入口后，`dist/` 只含 `index/schemas/core/catalog/packages` 五个模块，正好是 `exports["."]` 对外提供的内容。

### 2.3 新增文件

`README.md`、`docs/STABILITY.md`、`docs/OPERATIONS.md`（脚本生成）、`FREEZE-RECEIPT.md`（本文件）、`RESULT.md`、`LICENSE`（Apache-2.0 标准全文，sha256 `b40930bbcf80744c86c46a12bc9da056641d722716c378f5659b9e555ef833e1`）、`NOTICE`、`freeze-evidence/*.log|patch`、`bun.lock`。

### 2.4 构建产物 dist/

| 文件 | sha256 |
|---|---|
| `dist/catalog.d.ts` | `c22f91c44f1515977529798a8dffe2478a52806569daf7292cef9109f6bfe133` |
| `dist/catalog.js` | `b0821eab21d5a4c48d093bb7d4915e7e0b63af2c6a60c5ef58f6a1789169f1a3` |
| `dist/core.d.ts` | `6427a5e4c46822a07fd2e25039c6e85247209f27e5c283249a3ee9fa154ecb33` |
| `dist/core.js` | `5abf3f2c7fb2b91b16649d9a8606eebbbdc6d4e209fd2b2f0ea4406bba2b2c78` |
| `dist/index.d.ts` | `ceba226f2905ec968f32bcda4b0e50703a0210efc39d305841ade2601395b517` |
| `dist/index.js` | `ceba226f2905ec968f32bcda4b0e50703a0210efc39d305841ade2601395b517` |
| `dist/packages.d.ts` | `9e3ec414267fae91b146b9b7337085162ff3f97b372506f8e27dce3e324483a2` |
| `dist/packages.js` | `5b32e06dc1b75c8ab690c047346f957fa4dfb99e66c366c5253a1228eac07294` |
| `dist/schemas.d.ts` | `7e5f7b5ad97831787245e2afd50a9367323675beb7de6b242e281cbe96597911` |
| `dist/schemas.js` | `ebed7b454730ba9a8b08e3a383256331b8f477c7c1df459d8305b01c7aa9b7ef` |

## 3. 构建与测试结果（原始日志在 `freeze-evidence/`）

全部从干净状态开始：先执行 `rm -rf node_modules dist`，再按顺序运行。

| 步骤 | 命令 | 退出码 | 结果 |
|---|---|---|---|
| 安装 | `bun install --frozen-lockfile` | 0 | 3 个包 |
| 构建 | `bun run build`（`tsc -p tsconfig.json`） | **0** | 无报错，产出 10 个 dist 文件 |
| 全部测试 | `bun test test` | **1** | **57 pass，2 fail，2 errors**（59 项，3 个文件） |
| 契约测试 | `bun test test/contract.test.ts` | **0** | **57 pass，0 fail**，205 个 expect |
| Node 消费者 | `node test/consumer.ts`（经包自引用 `@aios/glass-contract` → `dist/`） | **0** | `@aios/glass-contract standalone Node consumer passed` |

### 3.1 `bun test test` 失败证据（可复现）

```
test/adapter.test.ts:
# Unhandled error between tests
error: Cannot find module '../../../adapters/mentra/commands' from '<pkg>/test/adapter.test.ts'

test/boundary.test.ts:
# Unhandled error between tests
error: Cannot find module '../../../check-d4-boundary' from '<pkg>/test/boundary.test.ts'

 57 pass
 2 fail
 2 errors
Ran 59 tests across 3 files.
```

复现方法：在本目录执行 `bun install --frozen-lockfile && bun test test`。

原因：这两个测试文件按冻结原样保留，但它们依赖 monorepo 里包外的文件，冻结快照不包含这些文件：
- `test/adapter.test.ts`：`../../../adapters/mentra/{commands,events,capabilities}`、`../../../../mobile/modules/engine/src/types/capabilities/mentra-live`，测的是 Mentra 衍生适配器
- `test/boundary.test.ts`：`../../../check-d4-boundary`，以及 `mobile/node_modules` 的符号链接，测的是 monorepo 的边界检查脚本

它们测的是**适配器和仓库边界**，不是契约本身。按规定不从其他提交取源码、不把适配器冻进契约，所以没有补齐这些依赖，也没有改写或删除测试。契约自身的测试（`contract.test.ts`，覆盖全部 50 条命令的 schema、JSON 往返、未知字段剥离，以及版本、顺序、URL、非有限数等拒绝路径）在独立包内全部通过。

### 3.2 发布检查

- `package.json` 仍是 `"version": "0.1.0"`、`"private": true`
- 没有运行 `npm publish` / `bun publish`，没有改 registry，没有执行任何 git 操作（本目录不是 git 仓库）

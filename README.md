# @aios/glass-contract — 设备契约 协议 v1

AIOS Host 与智能眼镜之间的设备契约（协议 v1）。仓库：https://github.com/KevinAIOS/glass-contract

许可为 [Apache-2.0](LICENSE)。npm 包名是 `@aios/glass-contract`，当前版本 `0.1.0`，`private: true`，尚未发布到 npm；请从这个 GitHub 仓库安装或引用。协议版本是 v1（`schema_version: 1`），与 npm 版本号无关。

## 这是什么

**Host ↔ 眼镜的设备契约**：AIOS Host 和一副眼镜之间怎么说话——消息信封、50 条命令、25 个事件、能力/权限词汇、错误码，以及编解码与顺序校验。

它**不是**：

- **不是 Experience 契约**：不规定应用（Experience）能依赖什么。
- **不是 SDK**：不是 `@aios/glass`，不提供 `registerApp`、`dashboard`、`stream` 之类的应用 API。
- **不是 Host↔运行时契约，也不是感知管线契约**。Host↔运行时契约见 [KevinAIOS/host-runtime-contract](https://github.com/KevinAIOS/host-runtime-contract)（契约版本 v0.1.0，与本仓库标签或设备契约不是同一份）。Reality Runtime 的最小核心实现见 [KevinAIOS/reality-runtime](https://github.com/KevinAIOS/reality-runtime)。
- **不是适配器实现**：Host 或某款眼镜的适配器（例如 Mentra 衍生适配器）不冻进本契约。

本仓库只公开这一份设备契约。

## 75 个操作

| 类别 | 数量 | 来源 |
|---|---|---|
| 命令 `aios.command` | **50** | `src/schemas.ts` → `CommandPayloadSchemas` 的键 |
| 事件 `aios.event` | **25** | `src/schemas.ts` → `EventPayloadSchemas` 的键 |
| 合计 | **75** | |

`CapabilityId`（17 个）和 `PermissionId`（12 个）是**枚举**，用来标注操作属于哪个能力、要什么权限，**不另算接口**。`ErrorCode`（17 个）同样是枚举。

完整清单见 [docs/OPERATIONS.md](docs/OPERATIONS.md)。稳定面与 v1 空操作见 [docs/STABILITY.md](docs/STABILITY.md)。

## 线上形状（v1）

每条消息 = `Header` + `kind` + `name` + `payload`：

```ts
{ schema_version: 1, device_session, generation, sequence, timestamp, correlation_id,
  kind: "aios.command" | "aios.event", name: "<75 个之一>", payload: {...} }
```

- `schema_version !== 1` → `aios.error.unsupported_version`
- 未知 `name` / 非法 payload → `aios.error.invalid_payload`，永不执行
- 已知对象的未知字段会被剥离（向前兼容）
- `createSequenceGuard`：`device_session`/`generation` 不符 → `stale_session`；`sequence` 不递增 → `out_of_order`
- `createManifest()` / `createCapabilityCatalog()` 只给词汇，全部 `declaration: "unknown"`、权限 `state: "unknown"`；**不代表设备支持，也不代表已授权**

## 安装、构建、测试

需要 [bun](https://bun.sh) 和 Node ≥ 22.6。

```bash
git clone https://github.com/KevinAIOS/glass-contract.git
cd glass-contract
bun install --frozen-lockfile
bun run build
bun test
```

默认测试只跑可独立通过的契约测试（`test/contract.test.ts`，57 项）和 Node 消费者冒烟。`test/adapter.test.ts` 与 `test/boundary.test.ts` 按冻结原样保留，它们依赖 monorepo 里包外的文件，不在默认测试里运行。冻结来源与计数见 [FREEZE-RECEIPT.md](FREEZE-RECEIPT.md)。

## 许可

Copyright 2026 Kevin AIOS (陈子恒)。Apache-2.0，见 [LICENSE](LICENSE) 与 [NOTICE](NOTICE)。NOTICE 致谢 MentraOS，并写明不得使用 Mentra 商标。

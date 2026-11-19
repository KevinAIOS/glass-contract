# 稳定面 vs v1 空操作

冻结点：`KevinAIOS/AIOSGlass` @ `d5a93a371b3d825b87771ab517c435551948a547`（分支 `codex/kele-20261103`），`aios/packages/glass-contract`。

## 1. 稳定面（协议 v1 冻结的内容）

下列内容以 `src/schemas.ts`、`src/core.ts`、`src/catalog.ts` 的冻结字节为准。v1 内不增删、不改名这 75 个操作，也不改它们的 payload 语义；要做破坏性改动需要新的协议版本（`schema_version` ≠ 1），是否以及何时出 v2 不在本步决定。

| 面 | 标识符 | 文件 |
|---|---|---|
| 信封头 | `HeaderSchema`（`schema_version: 1`、`device_session`、`generation`、`sequence`、`timestamp`、`correlation_id`） | `src/schemas.ts` |
| 50 条命令 | `CommandPayloadSchemas`、`CommandSchema`、`CommandName`、`Command` | `src/schemas.ts` |
| 25 个事件 | `EventPayloadSchemas`、`EventSchema`、`EventName`、`Event` | `src/schemas.ts` |
| 枚举（不另算接口） | `CapabilityIdSchema`（17）、`PermissionIdSchema`（12）、`ErrorCodeSchema`（17） | `src/schemas.ts` |
| 复合值 | `DeviceSchema`、`ConnectionSchema`、`SessionSchema`、`MediaSchema`、`PresentationSchema`、`SemanticActionSchema`、`AppActionSchema`、`PermissionSchema`、`CapabilitySchema`、`ManifestSchema`、`ErrorSchema` | `src/schemas.ts` |
| 编解码语义 | `decodeCommand` / `decodeEvent` / `encodeCommand` / `encodeEvent` / `validate` / `platformError`；版本不符 → `unsupported_version`，非法/未知 → `invalid_payload`，未知字段剥离，错误消息不带原生异常/令牌/URL | `src/core.ts` |
| 顺序与会话 | `createHeaderSource`、`createSequenceGuard`（`stale_session`、`out_of_order`） | `src/core.ts` |
| 能力归属 | `COMMAND_CAPABILITIES`、`EVENT_CAPABILITIES`（`aios.error` 归属为 `null`）、`createCapabilityCatalog`、`createManifest` | `src/catalog.ts` |

**能力声明的含义：** `createCapabilityCatalog()` 给出的 17 项全部是 `declaration: "unknown"`、`validation: "unverified"`、`availability: "unknown"`，`createManifest()` 里的权限全部是 `state: "unknown"`。源码注释写的是："The catalog defines vocabulary, not device support or a permission grant." 所以某个操作出现在契约里，只说明它的形状被冻结了，不说明任何一副眼镜或 Host 已经实现它。具体实现情况由 Host 通过 `Capability.declaration/availability` 声明，不支持时用 `aios.error.unsupported_capability` 回报。

### 公开入口里，但不在 75 个操作之内

`src/index.ts` 也导出了 `src/packages.ts`（`PackageRelease`、`PackageSource`、`PackageProof`、`packageProofText`、`packageRelease`、`verifyPackageSource`）。这些是安装包和目录的发布身份校验工具，不是 Host↔眼镜的线上消息。按冻结原样保留，不计入 75。它们是否该留在设备契约的公开面里，待批准时决定（见 `RESULT.md` 的残留风险）。

### 在 src/ 里，但不在 v1 公开面

`src/app-data.ts`、`src/catalog-client.ts`、`src/network-policy.ts`、`src/look-timing.ts`、`src/media-state.ts`：`src/index.ts` 不导出它们，独立构建也不编译它们（`tsconfig.json` 的 `files: ["src/index.ts"]`）。其中 `app-data.ts` 依赖包外的 `../../glass/overrides/ui/data`（SDK 侧），`catalog-client.ts` 依赖 Node 的 `buffer`。这几个文件按冻结字节保留，只作为来源记录，**不属于协议 v1**。

## 2. v1 空操作 / 未直播

这两条来自已批准的开源计划，说的是 **`@aios/glass` SDK 和 Host 侧**的事实，不是本契约的 schema 行为。本包不冻结 SDK。

### 2.1 `@aios/glass` 的 `dashboard.setContent`：v1 空操作并警告

- **在设备契约里能核对到的部分：** 契约里与 dashboard 相关的只有一条命令 `aios.display.dashboard`，它的 payload 是 `empty`（`z.object({})`，见 `src/schemas.ts` 的 `CommandPayloadSchemas`），归属 `aios.display`。也就是说，v1 设备契约**没有任何字段能携带 dashboard 内容**，SDK 的 `setContent` 在 v1 设备层没有下行通道，这和"空操作"是一致的。冻结快照里的适配器测试把这条命令映射到原生 `showDashboard`（`test/adapter.test.ts` 的 `targets` 表），这只是适配器行为，适配器本身不在本包里。
- **SDK 侧的空操作与警告代码：** 未能在此次抽出中核对到源码位置。本机没有完整 vendoring 的 `@aios/glass` 源码（冻结提交上该包主要是 `build.ts` 和 overrides，源码由 Mentra 衍生实现生成），本步也不为此 clone 或拉取。

### 2.2 `stream`：守护进程侧在 v1 未直播

- **在设备契约里能核对到的部分：** 契约冻结了 `aios.stream.start`（`destination` 只能是 `rtmp(s)/srt/http(s)` URL，另有 `capture_audio` 和可选的 `width/height/fps`）、`aios.stream.stop`，以及事件 `aios.stream.state`（`starting | streaming | reconnecting | suspended | stopping | stopped | failed`，可选 `attempt`），都归属 `aios.stream`，需要 `camera`、`microphone`、`network` 三项权限。这只是**形状**稳定：v1 里 Host 可以把 `aios.stream` 声明为不可用，并对这两条命令返回 `aios.error.unsupported_capability`。
- **守护进程侧"未直播"的代码：** 未能在此次抽出中核对到源码位置（原因同上）。

### 2.3 契约本身

冻结的 `src/` 里没有对任何操作写成静默吞掉的空实现，契约只负责校验和编解码。"空操作"只存在于 SDK 或 Host 实现层，所以第 3 步定 Experience 契约时，必须在 SDK 面上单独写清楚，不能从本包推出。

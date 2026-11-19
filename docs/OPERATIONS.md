# 75 个操作清单（由 src/schemas.ts 生成）

> 本文件由脚本从 `src/schemas.ts` 的 `CommandPayloadSchemas` / `EventPayloadSchemas` 键和 `src/catalog.ts` 的 `COMMAND_CAPABILITIES` / `EVENT_CAPABILITIES` 生成，未手抄。顺序与源码一致。

## 命令（50 条，`kind: "aios.command"`）

| # | name | CapabilityId |
|---|---|---|
| 1 | `aios.device.cancel` | `aios.connection-lifecycle` |
| 2 | `aios.display.dashboard` | `aios.display` |
| 3 | `aios.display.enabled` | `aios.display` |
| 4 | `aios.microphone.preferred` | `aios.microphone` |
| 5 | `aios.microphone.vad` | `aios.microphone` |
| 6 | `aios.microphone.loudness` | `aios.microphone` |
| 7 | `aios.speaker.playback-state` | `aios.speaker` |
| 8 | `aios.photo.field-of-view` | `aios.photo` |
| 9 | `aios.photo.tuning` | `aios.photo` |
| 10 | `aios.photo.warmup` | `aios.photo` |
| 11 | `aios.photo.warmup-stop` | `aios.photo` |
| 12 | `aios.video.defaults` | `aios.video` |
| 13 | `aios.video.duration` | `aios.video` |
| 14 | `aios.status.clock` | `aios.status` |
| 15 | `aios.status.ping` | `aios.status` |
| 16 | `aios.link.inspect` | `aios.link` |
| 17 | `aios.ready.inspect` | `aios.ready` |
| 18 | `aios.discovery.start` | `aios.scan-pair` |
| 19 | `aios.discovery.stop` | `aios.scan-pair` |
| 20 | `aios.device.pair` | `aios.scan-pair` |
| 21 | `aios.device.reconnect` | `aios.connection-lifecycle` |
| 22 | `aios.device.disconnect` | `aios.connection-lifecycle` |
| 23 | `aios.device.forget` | `aios.connection-lifecycle` |
| 24 | `aios.input.observe` | `aios.input` |
| 25 | `aios.display.present` | `aios.display` |
| 26 | `aios.display.clear` | `aios.display` |
| 27 | `aios.microphone.configure` | `aios.microphone` |
| 28 | `aios.speaker.volume` | `aios.speaker` |
| 29 | `aios.speaker.route` | `aios.speaker` |
| 30 | `aios.photo.capture` | `aios.photo` |
| 31 | `aios.gallery.inspect` | `aios.gallery` |
| 32 | `aios.gallery.list` | `aios.gallery` |
| 33 | `aios.gallery.sync` | `aios.gallery` |
| 34 | `aios.gallery.cancel` | `aios.gallery` |
| 35 | `aios.gallery.configure` | `aios.gallery` |
| 36 | `aios.video.start` | `aios.video` |
| 37 | `aios.video.stop` | `aios.video` |
| 38 | `aios.video.inspect` | `aios.video` |
| 39 | `aios.stream.start` | `aios.stream` |
| 40 | `aios.stream.stop` | `aios.stream` |
| 41 | `aios.wifi.scan` | `aios.wifi` |
| 42 | `aios.wifi.connect` | `aios.wifi` |
| 43 | `aios.wifi.forget` | `aios.wifi` |
| 44 | `aios.wifi.hotspot` | `aios.wifi` |
| 45 | `aios.led.set` | `aios.led` |
| 46 | `aios.status.inspect` | `aios.status` |
| 47 | `aios.version.inspect` | `aios.status` |
| 48 | `aios.ota.inspect` | `aios.ota` |
| 49 | `aios.ota.start` | `aios.ota` |
| 50 | `aios.imu.configure` | `aios.imu` |

## 事件（25 个，`kind: "aios.event"`）

| # | name | CapabilityId |
|---|---|---|
| 1 | `aios.link.state` | `aios.link` |
| 2 | `aios.ready.state` | `aios.ready` |
| 3 | `aios.device.discovered` | `aios.scan-pair` |
| 4 | `aios.connection.state` | `aios.connection-lifecycle` |
| 5 | `aios.input.action` | `aios.input` |
| 6 | `aios.display.accepted` | `aios.display` |
| 7 | `aios.microphone.frame` | `aios.microphone` |
| 8 | `aios.microphone.speaking` | `aios.microphone` |
| 9 | `aios.speaker.volume` | `aios.speaker` |
| 10 | `aios.photo.result` | `aios.photo` |
| 11 | `aios.photo.progress` | `aios.photo` |
| 12 | `aios.gallery.assets` | `aios.gallery` |
| 13 | `aios.gallery.state` | `aios.gallery` |
| 14 | `aios.video.state` | `aios.video` |
| 15 | `aios.stream.state` | `aios.stream` |
| 16 | `aios.wifi.state` | `aios.wifi` |
| 17 | `aios.wifi.networks` | `aios.wifi` |
| 18 | `aios.wifi.hotspot` | `aios.wifi` |
| 19 | `aios.led.accepted` | `aios.led` |
| 20 | `aios.status.battery` | `aios.status` |
| 21 | `aios.status.snapshot` | `aios.status` |
| 22 | `aios.version.state` | `aios.status` |
| 23 | `aios.ota.state` | `aios.ota` |
| 24 | `aios.imu.sample` | `aios.imu` |
| 25 | `aios.error` | `null`（跨能力错误事件） |

## 枚举（不另算接口）

- `CapabilityId`（17 个）：`aios.link`、`aios.ready`、`aios.scan-pair`、`aios.connection-lifecycle`、`aios.input`、`aios.display`、`aios.microphone`、`aios.speaker`、`aios.photo`、`aios.gallery`、`aios.video`、`aios.stream`、`aios.wifi`、`aios.led`、`aios.status`、`aios.ota`、`aios.imu`
- `PermissionId`（12 个）：`aios.permission.device`、`aios.permission.input`、`aios.permission.display`、`aios.permission.microphone`、`aios.permission.speaker`、`aios.permission.camera`、`aios.permission.media`、`aios.permission.network`、`aios.permission.light`、`aios.permission.status`、`aios.permission.update`、`aios.permission.motion`

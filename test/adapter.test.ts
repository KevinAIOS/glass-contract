import {expect, test} from "bun:test"
import {readFileSync} from "node:fs"
import {
  COMMAND_CAPABILITIES,
  EVENT_CAPABILITIES,
  EventPayloadSchemas,
  createManifest,
  decodeEvent,
  encodeEvent,
} from "../src/index.js"
import {planCommand, type AdapterContext} from "../../../adapters/mentra/commands"
import {mapInbound, mapNativeError, type Inbound} from "../../../adapters/mentra/events"
import {mapCapabilityDeclarations} from "../../../adapters/mentra/capabilities"
import {mentraLive} from "../../../../mobile/modules/engine/src/types/capabilities/mentra-live"
import {command, commands, header, unwrap} from "./fixtures"

function context(): AdapterContext {
  const manifest = createManifest()
  return {
    device_session: header.device_session,
    generation: header.generation,
    capabilities: manifest.capabilities.map((c) => ({
      ...c,
      declaration: "supported",
      availability: "available",
      validation: "software",
    })),
    permissions: manifest.permissions.map((p) => ({...p, state: "granted"})),
    connection: {state: "connected", ready: true},
    findDevice: (id) =>
      id === "device-1"
        ? {id, model: "Mentra Live", name: "Reference", address: "AA:BB:CC:DD:EE:FF", pairingCode: "1234"}
        : undefined,
  }
}

const targets = {
  "aios.device.cancel": "cancelConnectionAttempt",
  "aios.display.dashboard": "showDashboard",
  "aios.display.enabled": "setScreenDisabled",
  "aios.microphone.preferred": "setPreferredMic",
  "aios.microphone.vad": "setVoiceActivityDetectionEnabled",
  "aios.microphone.loudness": "setLoudnessGateEnabled",
  "aios.speaker.playback-state": "setOwnAppAudioPlaying",
  "aios.photo.field-of-view": "setCameraFov",
  "aios.photo.tuning": "setCameraTuningConfig",
  "aios.photo.warmup": "warmUpCamera",
  "aios.photo.warmup-stop": "stopCameraWarmUp",
  "aios.video.defaults": "setVideoRecordingDefaults",
  "aios.video.duration": "setMaxVideoRecordingDuration",
  "aios.status.clock": "setSystemTime",
  "aios.status.ping": "ping",
  "aios.link.inspect": "getGlassesStatus",
  "aios.ready.inspect": "getGlassesStatus",
  "aios.discovery.start": "startScan",
  "aios.discovery.stop": "stopScan",
  "aios.device.pair": "connect",
  "aios.device.reconnect": "connectDefault",
  "aios.device.disconnect": "disconnect",
  "aios.device.forget": "forget",
  "aios.input.observe": "subscription",
  "aios.display.present": "displayText",
  "aios.display.clear": "clearDisplay",
  "aios.microphone.configure": "setMicState",
  "aios.speaker.volume": "setGlassesMediaVolume",
  "aios.speaker.route": "bridge-wire",
  "aios.photo.capture": "requestPhoto",
  "aios.gallery.list": "gallery",
  "aios.gallery.sync": "gallery",
  "aios.gallery.cancel": "gallery",
  "aios.gallery.inspect": "queryGalleryStatus",
  "aios.gallery.configure": "setGalleryModeEnabled",
  "aios.video.start": "startVideoRecording",
  "aios.video.stop": "stopVideoRecording",
  "aios.video.inspect": "queryVideoRecordingStatus",
  "aios.stream.start": "startStream",
  "aios.stream.stop": "stopStream",
  "aios.wifi.scan": "requestWifiScan",
  "aios.wifi.connect": "sendWifiCredentials",
  "aios.wifi.forget": "forgetWifiNetwork",
  "aios.wifi.hotspot": "setHotspotState",
  "aios.led.set": "rgbLedControl",
  "aios.status.inspect": "getGlassesStatus",
  "aios.version.inspect": "requestVersionInfo",
  "aios.ota.inspect": "queryOtaStatus",
  "aios.ota.start": "startOtaUpdate",
  "aios.imu.configure": "setImuEnabled",
} as const satisfies Record<keyof typeof commands, string>

for (const name of Object.keys(commands) as (keyof typeof commands)[]) {
  test(`${name}: checked native plan, unsupported, missing permission and stale-session errors`, () => {
    const plan = unwrap(planCommand(command(name), context()))
    expect(plan.kind === "sdk" ? plan.method : plan.kind).toBe(targets[name])
    const missing = context()
    missing.capabilities = []
    expect(planCommand(command(name), missing)).toMatchObject({
      ok: false,
      error: {code: "aios.error.unsupported_capability", capability: COMMAND_CAPABILITIES[name]},
    })
    const denied = context()
    denied.permissions = []
    expect(planCommand(command(name), denied)).toMatchObject({ok: false, error: {code: "aios.error.permission_denied"}})
    expect(planCommand({...command(name), generation: 1}, context())).toMatchObject({
      ok: false,
      error: {code: "aios.error.stale_session"},
    })
  })
}

test("reference display cannot be enabled by a generic SDK method; unknown support fails closed", () => {
  const c = context()
  c.capabilities = mapCapabilityDeclarations(mentraLive)
  expect(c.capabilities.find((item) => item.id === "aios.display")!.declaration).toBe("unsupported")
  expect(c.capabilities.find((item) => item.id === "aios.photo")!.declaration).toBe("supported")
  expect(c.capabilities.every((item) => item.validation === "unverified" && item.availability === "unknown")).toBe(true)
  expect(planCommand(command("aios.display.present"), c)).toMatchObject({
    ok: false,
    error: {code: "aios.error.unsupported_capability"},
  })
  c.capabilities = createManifest().capabilities
  expect(planCommand(command("aios.photo.capture"), c).ok).toBe(false)
})

test("device operations require connection, readiness and unique host grants", () => {
  const c = context()
  c.connection = {state: "disconnected"}
  expect(planCommand(command("aios.photo.capture"), c)).toMatchObject({
    ok: false,
    error: {code: "aios.error.not_connected"},
  })
  expect(planCommand(command("aios.device.disconnect"), c).ok).toBe(true)
  c.connection = {state: "connected", ready: false}
  expect(planCommand(command("aios.photo.capture"), c)).toMatchObject({
    ok: false,
    error: {code: "aios.error.not_ready"},
  })
  c.connection = {state: "connected", ready: true}
  c.capabilities.find((p) => p.id === "aios.photo")!.availability = "unknown"
  expect(planCommand(command("aios.photo.capture"), c).ok).toBe(false)
  const duplicate = context()
  duplicate.permissions.push({
    ...duplicate.permissions.find((p) => p.id === "aios.permission.camera")!,
    state: "denied",
  })
  expect(planCommand(command("aios.photo.capture"), duplicate)).toMatchObject({
    ok: false,
    error: {code: "aios.error.permission_denied"},
  })
})

test("pair retains private scan metadata and rejects unknown or mismatched devices", () => {
  const plan = unwrap(planCommand(command("aios.device.pair"), context()))
  expect(plan).toMatchObject({
    method: "connect",
    args: [{pairingCode: "1234", address: "AA:BB:CC:DD:EE:FF"}, {saveAsDefault: true}],
  })
  expect(planCommand(command("aios.device.pair"), {...context(), findDevice: () => undefined}).ok).toBe(false)
  expect(
    planCommand(
      {
        ...command("aios.device.pair"),
        payload: {device: {...commands["aios.device.pair"].device, profile: "aios.device.simulator"}},
      },
      context(),
    ).ok,
  ).toBe(false)
})

test("media mappings preserve operation identity without adding cloud or model calls", () => {
  expect(unwrap(planCommand(command("aios.photo.capture"), context()))).toMatchObject({
    method: "requestPhoto",
    args: [{requestId: "request-1", webhookUrl: null, authToken: null, transferMethod: "ble"}],
  })
  expect(planCommand({...command("aios.photo.capture"), correlation_id: null}, context()).ok).toBe(false)
  expect(unwrap(planCommand(command("aios.video.stop"), context()))).toMatchObject({
    method: "stopVideoRecording",
    args: ["recording-1"],
  })
  expect(unwrap(planCommand(command("aios.microphone.configure"), context()))).toMatchObject({
    method: "setMicState",
    args: [true, true, false, true],
  })
  expect(unwrap(planCommand(command("aios.ota.start"), context()))).toMatchObject({
    method: "startOtaUpdate",
    args: ["http://192.168.1.20/manifest.json"],
  })
  expect(unwrap(planCommand(command("aios.speaker.volume"), context()))).toMatchObject({
    method: "setGlassesMediaVolume",
    args: [15],
  })
  expect(unwrap(planCommand({...command("aios.speaker.route"), payload: {enabled: false}}, context()))).toEqual({
    kind: "bridge-wire",
    payload: {type: "disable_i2s"},
  })
})

const inbound: Inbound[] = [
  {
    source: "galleryAssets",
    data: [{name: "photo.jpg", filePath: "/private/photo.jpg", size: 512, mime_type: "image/jpeg"}],
  },
  {source: "link", data: {state: "connected", fullyBooted: false}},
  {source: "ready", data: {state: "connected", fullyBooted: false}},
  {
    source: "device",
    data: {id: "device-1", name: "Reference", model: "Mentra Live", address: "hidden", pairingCode: "hidden"},
  },
  {source: "connection", data: {state: "bonding"}},
  {source: "button", data: {buttonId: "1", pressType: "short", timestamp: 19}},
  {
    source: "touch",
    data: {type: "touch_event", deviceModel: "Mentra Live", gestureName: "vendor-new-gesture", timestamp: 21},
  },
  {source: "display", data: {simulated: true}},
  {
    source: "pcm",
    data: {
      type: "mic_pcm",
      pcm: new Uint8Array([0, 255, 128, 1]).buffer,
      sampleRate: 16000,
      bitsPerSample: 16,
      channels: 1,
      encoding: "pcm_s16le",
      voiceActivityDetectionEnabled: false,
    },
  },
  {
    source: "lc3",
    data: {
      type: "mic_lc3",
      lc3: new Uint8Array([2, 3, 4]).buffer,
      sampleRate: 16000,
      channels: 1,
      encoding: "lc3",
      frameDurationMs: 10,
      frameSizeBytes: 3,
      bitrate: 2400,
      packetizedFromGlasses: true,
      voiceActivityDetectionEnabled: false,
    },
  },
  {source: "speaking", data: {type: "speaking_status", speaking: true, timestamp: 23}},
  {source: "volume", data: {level: 15, statusCode: 0}},
  {
    source: "photo",
    data: {
      type: "photo_response",
      state: "success",
      requestId: "request-1",
      uploadUrl: "https://ignored.example/upload",
      photoUrl: "file:///local/photo.jpg",
      timestamp: 12,
      fileSizeBytes: 14,
    },
  },
  {
    source: "photoProgress",
    data: {type: "photo_status", requestId: "request-1", status: "ready_for_transfer", timestamp: 15},
  },
  {
    source: "gallery",
    data: {type: "gallery_status", photos: 3, videos: 2, total: 5, totalSize: 800, hasContent: true, cameraBusy: false},
  },
  {
    source: "video",
    data: {
      type: "video_recording_status",
      requestId: "recording-1",
      success: true,
      status: "recording_status",
      timestamp: 25,
      data: {recording: true, duration_ms: 100},
    },
  },
  {
    source: "stream",
    data: {
      type: "stream_status",
      kind: "reconnect",
      status: "reconnecting",
      attempt: 2,
      maxAttempts: 3,
      reason: "SECRET",
    },
  },
  {source: "wifi", data: {type: "wifi_status_change", state: "connected", ssid: "local", localIp: "ignored"}},
  {
    source: "wifiNetworks",
    data: {type: "wifi_scan_result", networks: [{ssid: "local", requiresPassword: true, signalStrength: -55}]},
  },
  {
    source: "hotspot",
    data: {type: "hotspot_status_change", state: "enabled", ssid: "local", password: "SECRET", localIp: "ignored"},
  },
  {source: "led", data: {type: "rgb_led_control_response", state: "success", requestId: "request-1"}},
  {source: "battery", data: {type: "battery_status", level: -1, charging: false, timestamp: 25}},
  {
    source: "status",
    data: {connection: {state: "connected", fullyBooted: true}, batteryLevel: 90, charging: true, signalStrength: -45},
  },
  {
    source: "version",
    data: {
      androidVersion: "12",
      firmwareVersion: "legacy",
      besFirmwareVersion: "1",
      mtkFirmwareVersion: "2",
      buildNumber: "3",
      otaVersionUrl: "https://SECRET.example",
      appVersion: "40",
      hotspotOtaVersion: 1,
    },
  },
  {
    source: "ota",
    data: {
      type: "ota_status",
      session_id: "update-1",
      total_steps: 3,
      current_step: 1,
      step_type: "apk",
      phase: "download",
      step_percent: 100,
      overall_percent: 30,
      status: "step_complete",
    },
  },
  {source: "imu", data: {type: "accel_event", x: 0.5, y: -1, z: 9.8, timestamp: 31}},
  {source: "error", data: {code: "camera_busy", message: "SECRET", nativeStack: "SECRET"}},
]

for (const sample of inbound) {
  test(`${sample.source}: maps into an AIOS event and survives schema roundtrip`, () => {
    const event = unwrap(mapInbound(sample, header))
    expect(event).toMatchObject(header)
    expect(unwrap(decodeEvent(unwrap(encodeEvent(event))))).toEqual(event)
    expect(
      unwrap(decodeEvent({...event, nativeTag: "removed", payload: {...event.payload, nativeTag: "removed"}})),
    ).toEqual(event)
    expect(JSON.stringify(event)).not.toMatch(/SECRET|ignored|pairingCode|deviceModel|fullyBooted/)
  })
}

test("D2's exact 17 capabilities have executable command and inbound mappings", () => {
  const d2 = JSON.parse(readFileSync(new URL("../../../manifests/d2/fix/capabilities.json", import.meta.url), "utf8"))
  const ids = d2.capabilities.map((c: {id: string}) => `aios.${c.id}`).sort()
  expect([...new Set(Object.values(COMMAND_CAPABILITIES))].sort()).toEqual(ids)
  const events = inbound.map((sample) => unwrap(mapInbound(sample, header)))
  expect([...new Set(events.map((e) => EVENT_CAPABILITIES[e.name]).filter(Boolean))].sort()).toEqual(ids)
  expect(Object.keys(EventPayloadSchemas).sort()).toEqual([...new Set(events.map((e) => e.name))].sort())
})

test("partial completion and uncertain sensor semantics stay explicit", () => {
  expect(
    unwrap(
      mapInbound(
        {
          source: "photo",
          data: {
            type: "photo_response",
            state: "success",
            requestId: "x",
            uploadUrl: "https://upload.example",
            timestamp: 1,
          },
        },
        header,
      ),
    ),
  ).toMatchObject({name: "aios.photo.progress", payload: {state: "captured"}})
  expect(unwrap(mapInbound(inbound.find((s) => s.source === "ready")!, header))).toMatchObject({
    payload: {ready: false},
  })
  expect(unwrap(mapInbound(inbound.find((s) => s.source === "display")!, header))).toMatchObject({
    payload: {delivery: "accepted", simulated: true},
  })
  expect(unwrap(mapInbound(inbound.find((s) => s.source === "ota")!, header))).toMatchObject({
    payload: {state: "step-complete", progress: 30},
  })
  expect(unwrap(mapInbound(inbound.find((s) => s.source === "imu")!, header))).toMatchObject({
    timestamp: header.timestamp,
    payload: {unit: "unknown", source_timestamp: 31},
  })
  expect(unwrap(mapInbound(inbound.find((s) => s.source === "touch")!, header))).toMatchObject({
    payload: {action: "unknown"},
  })
  expect(unwrap(mapInbound(inbound.find((s) => s.source === "battery")!, header))).toMatchObject({
    payload: {percent: null},
  })
})

test("audio bytes survive JSON transport exactly including base64 padding", () => {
  for (let length = 0; length < 10; length++) {
    const bytes = Uint8Array.from({length}, (_, i) => (i * 127) % 256)
    const sample = inbound.find((s) => s.source === "pcm")! as Extract<Inbound, {source: "pcm"}>
    const event = unwrap(mapInbound({...sample, data: {...sample.data, pcm: bytes.buffer}}, header))
    if (event.name !== "aios.microphone.frame") throw new Error("Wrong event")
    expect(Buffer.from(event.payload.data_base64, "base64")).toEqual(Buffer.from(bytes))
  }
})

test("failed Wi-Fi attempt cannot become success even when connected to another network", () => {
  const event = unwrap(
    mapInbound(
      {
        source: "wifi",
        data: {type: "wifi_status_change", state: "connected", ssid: "wrong", error: "connected_to_other_network"},
      },
      header,
    ),
  )
  expect(event).toMatchObject({
    name: "aios.error",
    payload: {code: "aios.error.transport", correlation_id: header.correlation_id},
  })
})

test("invalid upstream payloads return sanitized errors, unknown error codes stay internal", () => {
  for (const input of [
    {source: "volume", data: {level: 16, statusCode: 0}},
    {source: "volume", data: {level: 1.5, statusCode: 0}},
    {source: "imu", data: {x: NaN, y: 0, z: 0, timestamp: 1}},
    {source: "connection", data: {state: "new-state"}},
    {source: "gallery", data: null},
    {source: "ota", data: {session_id: "x", step_type: "unknown"}},
  ]) {
    expect(mapInbound(input as Inbound, header)).toMatchObject({ok: false, error: {code: "aios.error.invalid_payload"}})
  }
  for (const value of [
    new Error("SECRET"),
    {code: "constructor", message: "SECRET"},
    {code: "future_error", url: "SECRET"},
  ]) {
    expect(mapNativeError(value)).toMatchObject({code: "aios.error.internal"})
    expect(JSON.stringify(mapNativeError(value))).not.toContain("SECRET")
  }
  expect(mapNativeError({code: "request_timeout"})).toMatchObject({code: "aios.error.timeout", retryable: true})
})

import {z} from "zod"

const id = z.string().min(1).max(256)
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const positive = count.min(1)
const percent = z.number().min(0).max(100)
const text = z.string().max(16384)
const empty = z.object({})
const httpUrl = z
  .string()
  .url()
  .max(4096)
  .refine((value) => /^https?:\/\//i.test(value))

export const CapabilityIdSchema = z.enum([
  "aios.link",
  "aios.ready",
  "aios.scan-pair",
  "aios.connection-lifecycle",
  "aios.input",
  "aios.display",
  "aios.microphone",
  "aios.speaker",
  "aios.photo",
  "aios.gallery",
  "aios.video",
  "aios.stream",
  "aios.wifi",
  "aios.led",
  "aios.status",
  "aios.ota",
  "aios.imu",
])
export type CapabilityId = z.infer<typeof CapabilityIdSchema>
export const PermissionIdSchema = z.enum([
  "aios.permission.device",
  "aios.permission.input",
  "aios.permission.display",
  "aios.permission.microphone",
  "aios.permission.speaker",
  "aios.permission.camera",
  "aios.permission.media",
  "aios.permission.network",
  "aios.permission.light",
  "aios.permission.status",
  "aios.permission.update",
  "aios.permission.motion",
])
export const PermissionSchema = z.object({
  id: PermissionIdSchema,
  state: z.enum(["unknown", "prompt", "granted", "denied", "restricted"]),
  scope: z.enum(["host", "device", "application"]),
})
export type Permission = z.infer<typeof PermissionSchema>

export const ErrorCodeSchema = z.enum([
  "aios.error.invalid_payload",
  "aios.error.unsupported_version",
  "aios.error.unsupported_operation",
  "aios.error.unsupported_capability",
  "aios.error.permission_denied",
  "aios.error.not_connected",
  "aios.error.not_ready",
  "aios.error.busy",
  "aios.error.timeout",
  "aios.error.cancelled",
  "aios.error.transport",
  "aios.error.storage",
  "aios.error.integrity",
  "aios.error.low_power",
  "aios.error.stale_session",
  "aios.error.out_of_order",
  "aios.error.internal",
])
export type ErrorCode = z.infer<typeof ErrorCodeSchema>
export const ErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string().min(1).max(256),
  retryable: z.boolean(),
  capability: CapabilityIdSchema.optional(),
  correlation_id: id.nullable(),
})
export type PlatformError = z.infer<typeof ErrorSchema>

export const CapabilitySchema = z
  .object({
    id: CapabilityIdSchema,
    declaration: z.enum(["supported", "unsupported", "unknown"]),
    validation: z.enum(["unverified", "software", "simulator", "hardware"]),
    availability: z.enum(["available", "unavailable", "unknown"]),
    permissions: z.array(PermissionIdSchema).max(12),
    errors: z.array(ErrorCodeSchema).min(1).max(32),
  })
  .refine(
    (value) => value.availability !== "available" || value.declaration === "supported",
    "Available capability requires a support declaration",
  )
export type Capability = z.infer<typeof CapabilitySchema>

export const DeviceSchema = z.object({
  id,
  name: z.string().min(1).max(256),
  profile: z.enum(["aios.device.simulator", "aios.device.camera-audio-reference", "aios.device.meta-rayban", "aios.device.rayneo-x3-pro", "aios.device.unknown"]),
})
export type Device = z.infer<typeof DeviceSchema>
export const ConnectionSchema = z.discriminatedUnion("state", [
  z.object({state: z.literal("disconnected")}),
  z.object({state: z.literal("discovering")}),
  z.object({state: z.literal("connecting")}),
  z.object({state: z.literal("pairing")}),
  z.object({state: z.literal("connected"), ready: z.boolean()}),
])
export type Connection = z.infer<typeof ConnectionSchema>
export const SessionSchema = z.object({
  device_session: id,
  generation: positive,
  device: DeviceSchema,
  connection: ConnectionSchema,
  mode: z.enum(["anonymous", "account"]),
})
export type Session = z.infer<typeof SessionSchema>

export const ManifestSchema = z
  .object({
    schema_version: z.literal(1),
    id: z.string().regex(/^aios\.[a-z0-9][a-z0-9.-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    capabilities: z.array(CapabilitySchema).max(17),
    permissions: z.array(PermissionSchema).max(12),
  })
  .superRefine((value, ctx) => {
    for (const key of ["capabilities", "permissions"] as const) {
      if (new Set(value[key].map((item) => item.id)).size !== value[key].length)
        ctx.addIssue({code: z.ZodIssueCode.custom, path: [key], message: "Duplicate identity"})
    }
    const permissions = new Set(value.permissions.map((p) => p.id))
    if (value.capabilities.some((c) => c.permissions.some((p) => !permissions.has(p))))
      ctx.addIssue({code: z.ZodIssueCode.custom, path: ["permissions"], message: "Missing permission declaration"})
  })
export type Manifest = z.infer<typeof ManifestSchema>

export const HeaderSchema = z.object({
  schema_version: z.literal(1),
  device_session: id,
  generation: positive,
  sequence: positive,
  /** Host receipt/creation time in Unix milliseconds. Device clocks are separate. */
  timestamp: count,
  correlation_id: id.nullable(),
})
export type Header = z.infer<typeof HeaderSchema>
export const MediaSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("aios.media.reference"),
    id,
    mime_type: id,
    uri: z
      .string()
      .url()
      .max(4096)
      .refine((value) => /^(https?|file|content|blob):/i.test(value)),
    bytes: count.optional(),
    duration_ms: count.optional(),
    width: positive.optional(),
    height: positive.optional(),
  }),
  z.object({
    kind: z.literal("aios.media.audio-frame"),
    encoding: z.enum(["pcm_s16le", "lc3"]),
    data_base64: z
      .string()
      .max(1048576)
      .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
    sample_rate_hz: positive,
    channels: positive.max(32),
    bits_per_sample: positive.optional(),
    frame_duration_ms: z.number().positive().optional(),
  }),
])
export type Media = z.infer<typeof MediaSchema>
export const PresentationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("aios.presentation.text"),
    text,
    x: count.optional(),
    y: count.optional(),
    font_size: positive.optional(),
  }),
  z.object({kind: z.literal("aios.presentation.clear")}),
  z.object({
    kind: z.literal("aios.presentation.audio"),
    media: MediaSchema.refine(
      (value) => value.kind === "aios.media.audio-frame" || value.mime_type.startsWith("audio/"),
    ),
    volume: z.number().min(0).max(1),
  }),
  z.object({
    kind: z.literal("aios.presentation.light"),
    enabled: z.boolean(),
    color: z.enum(["red", "green", "blue", "orange", "white"]),
  }),
])
export type Presentation = z.infer<typeof PresentationSchema>
export const SemanticActionSchema = z.object({
  kind: z.literal("aios.semantic-action"),
  action: z.enum(["activate", "cancel", "next", "previous", "hold", "unknown"]),
  control_id: id,
  source: z.enum(["button", "touch", "host"]),
  simulated: z.boolean(),
  source_timestamp: count.optional(),
})
export type SemanticAction = z.infer<typeof SemanticActionSchema>
export const AppActionSchema = z
  .object({
    kind: z.literal("aios.app-action"),
    app_id: id,
    action: z.enum(["open", "close", "invoke"]),
    action_id: id.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.action === "invoke" && !v.action_id)
      ctx.addIssue({code: z.ZodIssueCode.custom, path: ["action_id"], message: "Required for invoke"})
  })
export type AppAction = z.infer<typeof AppActionSchema>

// Known v1 objects strip unknown fields. Unknown discriminators/permissions never execute.
export const CommandPayloadSchemas = {
  "aios.device.cancel": empty,
  "aios.display.dashboard": empty,
  "aios.display.enabled": z.object({enabled: z.boolean()}),
  "aios.microphone.preferred": z.object({source: z.enum(["auto", "host", "device", "bluetooth"])}),
  "aios.microphone.vad": z.object({enabled: z.boolean()}),
  "aios.microphone.loudness": z.object({enabled: z.boolean()}),
  "aios.speaker.playback-state": z.object({playing: z.boolean()}),
  "aios.photo.field-of-view": z.object({
    degrees: z.number().min(62).max(118),
    vertical: z.enum(["center", "top", "bottom"]),
  }),
  "aios.photo.tuning": z.object({noise_reduction: z.boolean(), gain: z.boolean()}),
  "aios.photo.warmup": z.object({
    request_id: id,
    size: z.enum(["low", "medium", "high", "max"]),
    duration_ms: positive.max(60000),
  }),
  "aios.photo.warmup-stop": z.object({request_id: id}),
  "aios.video.defaults": z.object({width: positive, height: positive, fps: positive.max(240)}),
  "aios.video.duration": z.object({minutes: count.max(1440)}),
  "aios.status.clock": z.object({timestamp_ms: count}),
  "aios.status.ping": empty,
  "aios.link.inspect": empty,
  "aios.ready.inspect": empty,
  "aios.discovery.start": z.object({profile: DeviceSchema.shape.profile}),
  "aios.discovery.stop": empty,
  "aios.device.pair": z.object({device: DeviceSchema}),
  "aios.device.reconnect": empty,
  "aios.device.disconnect": empty,
  "aios.device.forget": empty,
  "aios.input.observe": z.object({enabled: z.boolean()}),
  "aios.display.present": z.object({text, x: count.optional(), y: count.optional(), font_size: positive.optional()}),
  "aios.display.clear": empty,
  "aios.microphone.configure": z.object({
    enabled: z.boolean(),
    source: z.enum(["device", "host"]),
    encoding: z.enum(["pcm_s16le", "lc3"]),
  }),
  "aios.speaker.volume": z.object({level: z.number().min(0).max(1)}),
  "aios.speaker.route": z.object({enabled: z.boolean()}),
  "aios.photo.capture": z.object({
    size: z.enum(["low", "medium", "high", "max"]),
    save: z.boolean(),
    sound: z.boolean(),
    compression: z.enum(["none", "medium", "heavy"]),
    mode: z.enum(["photo", "text"]).optional(),
    transfer: z.enum(["auto", "direct", "ble"]).optional(),
    exposure_ns: positive.optional(),
    iso: positive.nullable().optional(),
    exposure_divisor: positive.optional(),
    iso_cap: positive.optional(),
    noise_reduction: z.boolean().optional(),
    edge_enhancement: z.boolean().optional(),
    zsl: z.boolean().optional(),
    mfnr: z.boolean().optional(),
    digital_gain: z.number().positive().optional(),
    analog_gain: z.string().max(64).optional(),
  }),
  "aios.gallery.inspect": empty,
  "aios.gallery.list": empty,
  "aios.gallery.sync": empty,
  "aios.gallery.cancel": empty,
  "aios.gallery.configure": z.object({enabled: z.boolean()}),
  "aios.video.start": z.object({
    recording_id: id,
    save: z.boolean(),
    sound: z.boolean(),
    width: positive.optional(),
    height: positive.optional(),
    fps: positive.max(240).optional(),
  }),
  "aios.video.stop": z.object({recording_id: id}),
  "aios.video.inspect": empty,
  "aios.stream.start": z.object({
    destination: z
      .string()
      .url()
      .max(4096)
      .refine((value) => /^(rtmps?|srt|https?):\/\//i.test(value)),
    capture_audio: z.boolean(),
    width: positive.optional(),
    height: positive.optional(),
    fps: positive.max(240).optional(),
  }),
  "aios.stream.stop": empty,
  "aios.wifi.scan": empty,
  "aios.wifi.connect": z.object({ssid: z.string().min(1).max(32), password: z.string().max(128)}),
  "aios.wifi.forget": z.object({ssid: z.string().min(1).max(32)}),
  "aios.wifi.hotspot": z.object({enabled: z.boolean()}),
  "aios.led.set": z.object({
    enabled: z.boolean(),
    color: z.enum(["red", "green", "blue", "orange", "white"]),
    on_ms: count,
    off_ms: count,
    repetitions: positive.max(1000),
  }),
  "aios.status.inspect": empty,
  "aios.version.inspect": empty,
  "aios.ota.inspect": empty,
  "aios.ota.start": z.object({manifest_uri: httpUrl}),
  "aios.imu.configure": z.object({enabled: z.boolean()}),
} as const
export type CommandName = keyof typeof CommandPayloadSchemas
export type Command = {
  [K in CommandName]: Header & {kind: "aios.command"; name: K; payload: z.infer<(typeof CommandPayloadSchemas)[K]>}
}[CommandName]

export const EventPayloadSchemas = {
  "aios.link.state": z.object({connected: z.boolean(), protocol_version: count.optional()}),
  "aios.ready.state": z.object({ready: z.boolean()}),
  "aios.device.discovered": DeviceSchema,
  "aios.connection.state": ConnectionSchema,
  "aios.input.action": SemanticActionSchema,
  "aios.display.accepted": z.object({delivery: z.enum(["accepted", "rendered"]), simulated: z.boolean()}),
  "aios.microphone.frame": MediaSchema.options[1],
  "aios.microphone.speaking": z.object({speaking: z.boolean(), source_timestamp: count.optional()}),
  "aios.speaker.volume": z.object({level: z.number().min(0).max(1), confirmation: z.literal("reported")}),
  "aios.photo.result": MediaSchema.options[0],
  "aios.photo.progress": z.object({
    state: z.enum(["queued", "capturing", "captured", "transferring", "complete", "failed", "unknown"]),
  }),
  "aios.gallery.assets": z.object({assets: z.array(MediaSchema.options[0]).max(10000)}),
  "aios.gallery.state": z.object({
    photos: count,
    videos: count,
    total: count,
    bytes: count.optional(),
    camera_busy: z.boolean(),
  }),
  "aios.video.state": z.object({
    state: z.enum(["recording", "stopped", "unknown"]),
    recording_id: id.optional(),
    duration_ms: count.optional(),
  }),
  "aios.stream.state": z.object({
    state: z.enum(["starting", "streaming", "reconnecting", "suspended", "stopping", "stopped", "failed"]),
    attempt: count.optional(),
  }),
  "aios.wifi.state": z.object({connected: z.boolean(), ssid: z.string().max(32).optional()}),
  "aios.wifi.networks": z.object({
    networks: z.array(z.object({ssid: z.string().max(32), signal_dbm: z.number().finite().optional()})).max(256),
  }),
  "aios.wifi.hotspot": z.object({enabled: z.boolean(), ssid: z.string().max(32).optional()}),
  "aios.led.accepted": z.object({accepted: z.literal(true)}),
  "aios.status.battery": z.object({percent: percent.nullable(), charging: z.boolean()}),
  "aios.status.snapshot": z.object({
    connection: ConnectionSchema,
    battery_percent: percent.nullable(),
    charging: z.boolean().nullable(),
    signal_dbm: z.number().finite().nullable(),
  }),
  "aios.version.state": z.object({
    os_version: text,
    bridge_version: text,
    radio_version: text,
    processor_version: text,
    build: text,
  }),
  "aios.ota.state": z.object({
    update_session: id,
    component: z.enum(["application", "processor", "radio"]),
    phase: z.enum(["download", "install"]),
    progress: percent,
    state: z.enum(["running", "step-complete", "complete", "failed", "idle"]),
  }),
  "aios.imu.sample": z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
    unit: z.enum(["m/s2", "g", "unknown"]),
    source_timestamp: count.optional(),
  }),
  "aios.error": ErrorSchema,
} as const
export type EventName = keyof typeof EventPayloadSchemas
export type Event = {
  [K in EventName]: Header & {kind: "aios.event"; name: K; payload: z.infer<(typeof EventPayloadSchemas)[K]>}
}[EventName]

function envelopeSchema(kind: "aios.command" | "aios.event", payloads: Record<string, z.ZodTypeAny>) {
  const variants = Object.entries(payloads).map(([name, payload]) =>
    HeaderSchema.extend({kind: z.literal(kind), name: z.literal(name), payload}),
  )
  return z.discriminatedUnion(
    "name",
    variants as [(typeof variants)[number], (typeof variants)[number], ...(typeof variants)[number][]],
  )
}
// The mapped unions and runtime variants are built from the same registry.
export const CommandSchema = envelopeSchema("aios.command", CommandPayloadSchemas) as z.ZodType<Command>
export const EventSchema = envelopeSchema("aios.event", EventPayloadSchemas) as z.ZodType<Event>

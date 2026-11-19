import {describe, expect, test} from "bun:test"
import {
  AppActionSchema,
  CapabilityIdSchema,
  CommandPayloadSchemas,
  DeviceSchema,
  ErrorCodeSchema,
  ErrorSchema,
  EventPayloadSchemas,
  HeaderSchema,
  ManifestSchema,
  MediaSchema,
  PermissionSchema,
  PresentationSchema,
  SemanticActionSchema,
  SessionSchema,
  COMMAND_CAPABILITIES,
  EVENT_CAPABILITIES,
  createHeaderSource,
  createSequenceGuard,
  createManifest,
  decodeCommand,
  decodeEvent,
  encodeCommand,
  encodeEvent,
  platformError,
} from "../src/index.js"
import {command, commands, device, header, unwrap} from "./fixtures"

describe("v1 command protocol", () => {
  for (const name of Object.keys(commands) as (keyof typeof commands)[]) {
    test(`${name}: schema, JSON roundtrip, deep unknown-field stripping`, () => {
      const canonical = command(name)
      expect(unwrap(decodeCommand(unwrap(encodeCommand(canonical))))).toEqual(canonical)
      expect(
        unwrap(
          decodeCommand({
            ...canonical,
            upstream: {secret: "hidden"},
            payload: {...canonical.payload, upstreamFlag: true},
          }),
        ),
      ).toEqual(canonical)
    })
  }
  test("registries cover every command, event and capability", () => {
    expect(Object.keys(commands).sort()).toEqual(Object.keys(CommandPayloadSchemas).sort())
    expect(Object.keys(COMMAND_CAPABILITIES).sort()).toEqual(Object.keys(CommandPayloadSchemas).sort())
    expect(Object.keys(EVENT_CAPABILITIES).sort()).toEqual(Object.keys(EventPayloadSchemas).sort())
    expect([...new Set(Object.values(COMMAND_CAPABILITIES))].sort()).toEqual([...CapabilityIdSchema.options].sort())
    expect([...new Set(Object.values(EVENT_CAPABILITIES).filter(Boolean))].sort()).toEqual(
      [...CapabilityIdSchema.options].sort(),
    )
  })
  test("rejects unknown operation/version/kind, malformed JSON, nonfinite numbers and invalid URLs", () => {
    expect(decodeCommand({...command("aios.link.inspect"), name: "aios.destroy"}).ok).toBe(false)
    expect(decodeCommand({...command("aios.link.inspect"), schema_version: 2})).toMatchObject({
      ok: false,
      error: {code: "aios.error.unsupported_version"},
    })
    for (const value of [
      "{",
      null,
      [],
      42,
      {...command("aios.link.inspect"), kind: "mentra.command"},
      {...command("aios.link.inspect"), sequence: Infinity},
      {...command("aios.ota.start"), payload: {manifest_uri: "file:///private/ota"}},
      {...command("aios.speaker.volume"), payload: {level: 2}},
    ])
      expect(decodeCommand(value).ok).toBe(false)
  })
  test("metadata is required, bounded and integer; device and host clocks remain separate", () => {
    for (const key of Object.keys(header)) {
      const copy = {...header} as Record<string, unknown>
      delete copy[key]
      expect(HeaderSchema.safeParse(copy).success).toBe(false)
    }
    for (const key of ["generation", "sequence"])
      for (const value of [0, -1, 1.2, Number.MAX_SAFE_INTEGER + 1])
        expect(HeaderSchema.safeParse({...header, [key]: value}).success).toBe(false)
  })
})

test("manifest never grants support, availability, hardware validation or permission implicitly", () => {
  const manifest = ManifestSchema.parse(createManifest())
  expect(manifest.capabilities).toHaveLength(17)
  expect(
    manifest.capabilities.every(
      (c) =>
        c.declaration === "unknown" &&
        c.availability === "unknown" &&
        c.validation === "unverified" &&
        c.errors.length > 0,
    ),
  ).toBe(true)
  expect(manifest.permissions.every((p) => p.state === "unknown")).toBe(true)
  expect(
    ManifestSchema.safeParse({...manifest, capabilities: [...manifest.capabilities, manifest.capabilities[0]]}).success,
  ).toBe(false)
  expect(ManifestSchema.safeParse({...manifest, permissions: []}).success).toBe(false)
  expect(ManifestSchema.parse({...manifest, vendorManifest: true})).toEqual(manifest)
})

test("all foundational public types validate, canonicalize and reject malformed input", () => {
  const examples = [
    [DeviceSchema, device],
    [PermissionSchema, {id: "aios.permission.camera", state: "denied", scope: "host"}],
    [
      SessionSchema,
      {
        device_session: header.device_session,
        generation: 2,
        device,
        connection: {state: "connected", ready: false},
        mode: "anonymous",
      },
    ],
    [
      MediaSchema,
      {kind: "aios.media.reference", id: "photo-1", mime_type: "image/jpeg", uri: "file:///local/photo.jpg", bytes: 3},
    ],
    [PresentationSchema, {kind: "aios.presentation.text", text: "中文"}],
    [
      SemanticActionSchema,
      {kind: "aios.semantic-action", action: "activate", control_id: "button-1", source: "button", simulated: true},
    ],
    [AppActionSchema, {kind: "aios.app-action", app_id: "aios.camera", action: "invoke", action_id: "capture"}],
  ] as const
  for (const [schema, value] of examples) {
    expect(schema.parse(JSON.parse(JSON.stringify(value)))).toEqual(value)
    expect(schema.parse({...value, unknown: "removed"})).toEqual(value)
    expect(schema.safeParse({}).success).toBe(false)
  }
  expect(AppActionSchema.safeParse({kind: "aios.app-action", app_id: "x", action: "invoke"}).success).toBe(false)
  expect(PermissionSchema.safeParse({id: "aios.permission.root", state: "granted", scope: "host"}).success).toBe(false)
  const image = {kind: "aios.media.reference", id: "photo-1", mime_type: "image/jpeg", uri: "file:///photo.jpg"}
  expect(PresentationSchema.safeParse({kind: "aios.presentation.audio", media: image, volume: 0.5}).success).toBe(false)
  expect(MediaSchema.safeParse({...image, uri: "javascript:alert(1)"}).success).toBe(false)
  expect(
    MediaSchema.safeParse({
      kind: "aios.media.audio-frame",
      encoding: "pcm_s16le",
      data_base64: "not base64",
      sample_rate_hz: 16000,
      channels: 1,
    }).success,
  ).toBe(false)
})

test("every error has a stable sanitized representation and roundtrips as an event", () => {
  for (const code of ErrorCodeSchema.options) {
    const error = ErrorSchema.parse(platformError(code, header.correlation_id))
    const event = unwrap(
      decodeEvent({
        ...header,
        kind: "aios.event",
        name: "aios.error",
        payload: {...error, nativeException: "token=SECRET"},
      }),
    )
    expect(unwrap(decodeEvent(unwrap(encodeEvent(event))))).toEqual(event)
    expect(JSON.stringify(event)).not.toContain("SECRET")
  }
})

test("reconnect invalidates old callbacks; invalid frames never consume sequence", () => {
  const next = createHeaderSource("s", 2, () => 1234)
  const guard = createSequenceGuard("s", 2)
  const first = next("first"),
    second = next("second")
  expect(guard(first).ok).toBe(true)
  expect(guard(first)).toMatchObject({ok: false, error: {code: "aios.error.out_of_order", correlation_id: "first"}})
  for (const changed of [{generation: 1}, {generation: 3}, {device_session: "old"}])
    expect(guard({...second, ...changed})).toMatchObject({ok: false, error: {code: "aios.error.stale_session"}})
  expect(guard({...second, sequence: NaN}).ok).toBe(false)
  expect(guard(second).ok).toBe(true)
  expect(guard({...second, sequence: 10}).ok).toBe(true)
  expect(guard({...second, sequence: 9}).ok).toBe(false)
  expect(first.timestamp).toBe(1234)
})

import {z} from "zod"
import {
  CommandSchema,
  EventSchema,
  HeaderSchema,
  type Command,
  type Event,
  type Header,
  type ErrorCode,
  type PlatformError,
} from "./schemas.js"

export type Result<T> = {ok: true; value: T} | {ok: false; error: PlatformError}

const messages: Record<ErrorCode, string> = {
  "aios.error.invalid_payload": "Invalid platform payload",
  "aios.error.unsupported_version": "Unsupported contract version",
  "aios.error.unsupported_operation": "Unsupported platform operation",
  "aios.error.unsupported_capability": "Capability is not supported",
  "aios.error.permission_denied": "Required permission is not granted",
  "aios.error.not_connected": "Device is not connected",
  "aios.error.not_ready": "Device is not ready",
  "aios.error.busy": "Device is busy",
  "aios.error.timeout": "Operation timed out",
  "aios.error.cancelled": "Operation was cancelled",
  "aios.error.transport": "Device communication failed",
  "aios.error.storage": "Device storage is unavailable",
  "aios.error.integrity": "Data integrity check failed",
  "aios.error.low_power": "Device power is insufficient",
  "aios.error.stale_session": "Session has expired",
  "aios.error.out_of_order": "Duplicate or out-of-order message",
  "aios.error.internal": "Platform operation failed",
}

/** Never include a native exception message, token, URL or arbitrary details. */
export function platformError(code: ErrorCode, correlation_id: string | null = null): PlatformError {
  return {
    code,
    message: messages[code],
    retryable: ["aios.error.busy", "aios.error.timeout", "aios.error.transport", "aios.error.not_ready"].includes(code),
    correlation_id,
  }
}

export function validate<T>(schema: z.ZodType<T>, input: unknown): Result<T> {
  const result = schema.safeParse(input)
  return result.success
    ? {ok: true, value: result.data}
    : {ok: false, error: platformError("aios.error.invalid_payload")}
}

function decode<T>(schema: z.ZodType<T>, input: unknown): Result<T> {
  let value = input
  if (typeof value === "string") {
    if (value.length > 1100000) return {ok: false, error: platformError("aios.error.invalid_payload")}
    try {
      value = JSON.parse(value)
    } catch {
      return {ok: false, error: platformError("aios.error.invalid_payload")}
    }
  }
  if (value && typeof value === "object" && "schema_version" in value && value.schema_version !== 1)
    return {ok: false, error: platformError("aios.error.unsupported_version")}
  return validate(schema, value)
}

export function decodeCommand(input: unknown): Result<Command> {
  return decode(CommandSchema, input)
}
export function decodeEvent(input: unknown): Result<Event> {
  return decode(EventSchema, input)
}
export function encodeCommand(command: Command): Result<string> {
  const result = decodeCommand(command)
  return result.ok ? {ok: true, value: JSON.stringify(result.value)} : result
}
export function encodeEvent(event: Event): Result<string> {
  const result = decodeEvent(event)
  return result.ok ? {ok: true, value: JSON.stringify(result.value)} : result
}

/** One instance per producer/session generation. A reconnect creates a new instance. */
export function createHeaderSource(device_session: string, generation: number, now: () => number = Date.now) {
  HeaderSchema.parse({schema_version: 1, device_session, generation, sequence: 1, timestamp: 0, correlation_id: null})
  let sequence = 0
  return (correlation_id: string | null = null): Header => {
    const header = HeaderSchema.parse({
      schema_version: 1,
      device_session,
      generation,
      sequence: sequence + 1,
      timestamp: now(),
      correlation_id,
    })
    sequence = header.sequence
    return header
  }
}

/** Per ordered input stream. No incoming message may advance the active generation. */
export function createSequenceGuard(device_session: string, generation: number) {
  HeaderSchema.parse({schema_version: 1, device_session, generation, sequence: 1, timestamp: 0, correlation_id: null})
  let last = 0
  return (input: Header): Result<Header> => {
    const parsed = validate(HeaderSchema, input)
    if (!parsed.ok) return parsed
    const header = parsed.value
    if (header.device_session !== device_session || header.generation !== generation)
      return {ok: false, error: platformError("aios.error.stale_session", header.correlation_id)}
    if (header.sequence <= last)
      return {ok: false, error: platformError("aios.error.out_of_order", header.correlation_id)}
    last = header.sequence
    return {ok: true, value: header}
  }
}

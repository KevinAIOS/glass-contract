import type {DataNeed, DataResult, DataSchema, DataSource} from "../../glass/overrides/ui/data"
export type {DataNeed, DataResult, DataSchema, DataSource}
export type DataIdentity = DataResult["identity"]
export type DataScope = {id: string; label: string; description: string}
export type DataQuery = {requestId: string; identity: DataIdentity; scopes: string[]; need: DataNeed}
export interface DataProvider {
  readonly destination: string
  scopes(identity: DataIdentity, signal: AbortSignal): Promise<DataScope[]>
  grant?(query: DataQuery, signal: AbortSignal): Promise<void>
  revoke?(identity: DataIdentity, signal: AbortSignal): Promise<void>
  cancel?(query: DataQuery, signal: AbortSignal): Promise<void>
  query(request: DataQuery, signal: AbortSignal): Promise<unknown>
  source(request: {query: DataQuery; source: DataSource}, signal: AbortSignal): Promise<unknown>
}
const fail = (): never => {
  throw new Error("invalid_data_result")
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
export const dataId = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9_.:-]{1,160}$/.test(v)
const safeText = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max && !v.includes("\u0000")
/** Deliberately bounded JSON-schema subset; unknown keywords fail rather than silently weakening a declaration. */
export function validateSchema(s: unknown, depth = 0): asserts s is DataSchema {
  if (
    depth > 8 ||
    !object(s) ||
    !["object", "array", "string", "number", "boolean", "null"].includes(String(s.type)) ||
    Object.keys(s).some(
      (k) => !["type", "properties", "required", "items", "maxItems", "maxLength", "additionalProperties"].includes(k),
    )
  )
    throw new Error("invalid_data_schema")
  if (s.type === "object") {
    if (
      !object(s.properties) ||
      Object.keys(s.properties).length > 64 ||
      s.additionalProperties !== false ||
      !Array.isArray(s.required) ||
      s.required.some((k) => typeof k !== "string" || !Object.hasOwn(s.properties as object, k))
    )
      throw new Error("invalid_data_schema")
    for (const [k, v] of Object.entries(s.properties)) {
      if (!dataId(k) || ["__proto__", "constructor", "prototype"].includes(k)) throw new Error("invalid_data_schema")
      validateSchema(v, depth + 1)
    }
  }
  if (s.type === "array") {
    if (!Number.isInteger(s.maxItems) || Number(s.maxItems) < 0 || Number(s.maxItems) > 1000)
      throw new Error("invalid_data_schema")
    validateSchema(s.items, depth + 1)
  }
  if (s.type === "string" && (!Number.isInteger(s.maxLength) || Number(s.maxLength) < 1 || Number(s.maxLength) > 20000))
    throw new Error("invalid_data_schema")
}
export function validateNeed(v: unknown): DataNeed {
  if (
    !object(v) ||
    !safeText(v.need, 2000) ||
    !v.need.trim() ||
    !safeText(v.purpose, 1000) ||
    !v.purpose.trim() ||
    Object.keys(v).some((k) => !["need", "purpose", "schema"].includes(k))
  )
    throw new Error("invalid_data_need")
  validateSchema(v.schema)
  return JSON.parse(JSON.stringify(v))
}
export function validateData(v: unknown, s: DataSchema): void {
  if (s.type === "null") {
    if (v !== null) fail()
    return
  }
  if (s.type === "object") {
    if (
      !object(v) ||
      Object.keys(v).some((k) => !Object.hasOwn(s.properties!, k)) ||
      s.required!.some((k) => !Object.hasOwn(v, k))
    )
      fail()
    for (const [k, value] of Object.entries(v as Record<string, unknown>)) validateData(value, s.properties![k])
  } else if (s.type === "array") {
    if (!Array.isArray(v) || v.length > s.maxItems!) fail()
    for (const value of v as unknown[]) validateData(value, s.items!)
  } else if (s.type === "string") {
    if (!safeText(v, s.maxLength!)) fail()
  } else if (typeof v !== s.type || (s.type === "number" && !Number.isFinite(v))) fail()
}
function identityMatches(a: unknown, b: DataIdentity) {
  return object(a) && Object.keys(a).length === 4 && Object.entries(b).every(([k, v]) => a[k] === v)
}
export function validateResult(value: unknown, query: DataQuery): DataResult {
  if (
    !object(value) ||
    JSON.stringify(value).length > 2_000_000 ||
    value.requestId !== query.requestId ||
    !identityMatches(value.identity, query.identity) ||
    !safeText(value.updatedAt, 40) ||
    !Number.isFinite(Date.parse(value.updatedAt)) ||
    !Array.isArray(value.sources) ||
    value.sources.length > 1000 ||
    !Array.isArray(value.warnings) ||
    value.warnings.length > 100 ||
    value.warnings.some((w) => !safeText(w, 1000)) ||
    Object.keys(value).some((k) => !["requestId", "identity", "updatedAt", "data", "sources", "warnings"].includes(k))
  )
    fail()
  const v = value as Record<string, any>,
    ids = new Set<string>()
  for (const s of v.sources) {
    if (
      !object(s) ||
      !dataId(s.id) ||
      ids.has(s.id) ||
      !query.scopes.includes(String(s.scopeId)) ||
      !safeText(s.title, 300) ||
      Object.keys(s).some((k) => !["id", "scopeId", "title"].includes(k))
    )
      fail()
    ids.add(s.id as string)
  }
  validateData(v.data, query.need.schema)
  return JSON.parse(JSON.stringify(value))
}
export function validateScopes(value: unknown): DataScope[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("invalid_data_scopes")
  const ids = new Set<string>()
  for (const s of value) {
    if (
      !object(s) ||
      !dataId(s.id) ||
      ids.has(s.id) ||
      !safeText(s.label, 120) ||
      !safeText(s.description, 1000) ||
      Object.keys(s).some((k) => !["id", "label", "description"].includes(k))
    )
      throw new Error("invalid_data_scopes")
    ids.add(s.id)
  }
  return value as DataScope[]
}

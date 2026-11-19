import {z} from "zod"

export const mediaIdSchema = z.string().regex(/^[a-zA-Z0-9-]{1,128}$/)
export const assetSchema = z.object({
  id: mediaIdSchema,
  owner: z.string(),
  request_key: z.string(),
  uri: z.string(),
  bytes: z.number().int().positive(),
  mime_type: z.enum(["image/jpeg", "video/mp4"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  source: z.enum(["video_frame", "native_photo", "video_recording"]),
  created_at: z.number(),
  expires_at: z.number(),
  device_id: z.string(),
  sdk_version: z.string(),
  elapsed_ms: z.number(),
  frame_age_ms: z.number(),
  deleted: z.boolean().default(false),
})
export type MediaAsset = z.infer<typeof assetSchema>
const requestSchema = z.object({
  id: mediaIdSchema,
  owner: z.string(),
  key: z.string(),
  state: z.enum(["capturing", "complete", "cancelled", "failed"]),
  error: z.string().optional(),
})
const jobSchema = z.object({
  id: mediaIdSchema,
  asset_id: mediaIdSchema,
  owner: z.string(),
  destination: z.string(),
  state: z.enum(["pending", "sending", "sent", "failed", "expired", "cancelled"]),
  attempts: z.number().int().nonnegative(),
  next_at: z.number(),
  expires_at: z.number(),
  error: z.string().optional(),
})
export type OutboxJob = z.infer<typeof jobSchema>
export const stateSchema = z.object({
  version: z.literal(1),
  assets: z.array(assetSchema).max(10000),
  requests: z.array(requestSchema).max(10000),
  jobs: z.array(jobSchema).max(10000),
  limits: z.object({
    max_bytes: z
      .number()
      .int()
      .min(1024)
      .max(1024 ** 3),
    max_assets: z.number().int().min(1).max(5000),
    ttl_ms: z
      .number()
      .int()
      .min(1000)
      .max(30 * 86400000),
  }),
})
export type MediaState = z.infer<typeof stateSchema>

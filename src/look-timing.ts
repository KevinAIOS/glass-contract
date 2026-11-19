/** Snapshot capture has one fresh-frame retry. The Host owns cancellation and release. */
export const GLASS_LOOK_TIMING = Object.freeze({
  workMs: 40_000,
  releaseMs: 6_000,
  restoreInputMs: 8_000,
  gatewayMs: 60_000,
  mcpIdleSeconds: 70,
})

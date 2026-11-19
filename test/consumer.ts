// Runs against the built package export with Node, without Expo, a phone or native mocks.
import assert from "node:assert/strict"
import {createManifest, ManifestSchema, createHeaderSource, decodeCommand, type Command} from "@aios/glass-contract"

const manifest = ManifestSchema.parse(createManifest())
const next = createHeaderSource("consumer-session", 1, () => 1000)
const command: Command = {...next("consumer-request"), kind: "aios.command", name: "aios.status.inspect", payload: {}}
assert.equal(manifest.capabilities.length, 17)
assert.deepEqual(decodeCommand(JSON.stringify(command)), {ok: true, value: command})
assert.equal(
  manifest.permissions.every((p) => p.state === "unknown"),
  true,
)
console.log("@aios/glass-contract standalone Node consumer passed")

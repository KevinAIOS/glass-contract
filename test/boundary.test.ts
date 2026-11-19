import {expect, test} from "bun:test"
import {mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from "node:fs"
import {resolve} from "node:path"
import {fileURLToPath} from "node:url"
import {checkBoundary} from "../../../check-d4-boundary"

const packageRoot = fileURLToPath(new URL("..", import.meta.url))
const repoRoot = resolve(packageRoot, "../../..")

test("public source graph and emitted declarations contain no upstream types", () => {
  expect(checkBoundary(packageRoot)).toEqual([])
})

const leaks = [
  {
    name: "type-only upstream import",
    source:
      'import type {BluetoothSdkPublicModule} from "../../../../mobile/modules/bluetooth-sdk/src/BluetoothSdk.types"; export type DeviceApi = BluetoothSdkPublicModule',
  },
  {
    name: "relative upstream re-export",
    source: 'export * from "../../../../mobile/modules/bluetooth-sdk/src/BluetoothSdk.types"',
  },
  {
    name: "inferred upstream return type",
    source: 'import {readDevice} from "../private-adapter"; export const getDevice = () => readDevice()',
  },
  {name: "forbidden dependency alias", source: 'export type DeviceApi = import("@mentra/bluetooth-sdk").Device'},
  {name: "dynamic dependency", source: 'export const adapter = () => import("../private-adapter")'},
  {name: "extra public adapter export", source: "export const schemaVersion = 1", extraExport: true},
]

for (const leak of leaks) {
  test(`boundary rejects ${leak.name}`, () => {
    const temporary = mkdtempSync(resolve(repoRoot, "aios/out/d4-boundary-"))
    try {
      mkdirSync(resolve(temporary, "src"))
      symlinkSync(resolve(repoRoot, "mobile/node_modules"), resolve(temporary, "node_modules"), "dir")
      const pkg = JSON.parse(readFileSync(resolve(packageRoot, "package.json"), "utf8"))
      if (leak.extraExport) pkg.exports["./adapter"] = "./private-adapter.ts"
      writeFileSync(resolve(temporary, "package.json"), JSON.stringify(pkg))
      writeFileSync(
        resolve(temporary, "private-adapter.ts"),
        'interface MentraDevice {nativeAddress: string}; export const readDevice = (): MentraDevice => ({nativeAddress: "private"})',
      )
      writeFileSync(resolve(temporary, "src/index.ts"), leak.source)
      const errors = checkBoundary(temporary)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.join("\n")).toMatch(/Upstream|Unapproved|escapes|dynamic|exports/)
    } finally {
      rmSync(temporary, {recursive: true, force: true})
    }
  })
}

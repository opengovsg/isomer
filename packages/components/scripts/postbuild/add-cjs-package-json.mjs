/**
 * Ensures the CommonJS build inside `dist/cjs` remains resolvable after the
 * package-level `"type": "module"` flag flips Node's default to ESM.
 *
 * Node resolves files top-down: once a package declares ESM at the root,
 * every nested `.js` is treated as ESM unless another `package.json` changes
 * the type. Dropping a small manifest alongside the compiled output is the
 * lightest-weight way to keep `require()` consumers (e.g. Tailwind's JIT via
 * jiti) working without renaming files to `.cjs` or reworking the build.
 *
 * This mirrors what other dual-distribution libraries do—see e.g.
 *   - React Aria's build tooling (`packages/a11y/src/scripts/set-cjs-package-json.ts`)
 *   - Vite's plugin ecosystem (e.g. `@vitejs/plugin-react` emits a nested
 *     `package.json` with `{ "type": "commonjs" }` for its CJS bundle)
 */

import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const currentDir = fileURLToPath(new URL(".", import.meta.url))
const distCjsDir = resolve(currentDir, "../../dist/cjs")
const targetFile = resolve(distCjsDir, "package.json")

await mkdir(distCjsDir, { recursive: true })
await writeFile(
  targetFile,
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
  "utf8",
)

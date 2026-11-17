// Points both builds at one fixture by copying it into apps/template (the Astro build reads
// apps/template's data by default, see src/lib/site.ts).
//   node scripts/fixture.mjs apply <fixtureDir>
//   node scripts/fixture.mjs restore     # back to the committed sample site
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const TEMPLATE = path.resolve(import.meta.dirname, "../../../apps/template")
const ENTRIES = ["data", "schema", "sitemap.json"]
const [cmd, fixtureDir] = process.argv.slice(2)

if (cmd === "apply") {
  for (const entry of ENTRIES) {
    fs.rmSync(path.join(TEMPLATE, entry), { recursive: true, force: true })
    fs.cpSync(path.join(fixtureDir, entry), path.join(TEMPLATE, entry), {
      recursive: true,
    })
  }
} else if (cmd === "restore") {
  execFileSync("git", ["checkout", "--", ...ENTRIES], {
    cwd: TEMPLATE,
    stdio: "inherit",
  })
  execFileSync("git", ["clean", "-fdq", "--", "schema"], {
    cwd: TEMPLATE,
    stdio: "inherit",
  })
} else {
  throw new Error("usage: fixture.mjs apply <dir> | restore")
}

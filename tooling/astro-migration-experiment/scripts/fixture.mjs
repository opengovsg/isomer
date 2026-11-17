// Points both builds at one fixture by copying it into apps/template and apps/template-astro.
//   node scripts/fixture.mjs apply <fixtureDir>
//   node scripts/fixture.mjs restore     # back to the committed sample site
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const APPS = ["template", "template-astro"].map((app) =>
  path.resolve(import.meta.dirname, "../../../apps", app),
)
const ENTRIES = ["data", "schema", "sitemap.json"]
const [cmd, fixtureDir] = process.argv.slice(2)

if (cmd === "apply") {
  for (const app of APPS)
    for (const entry of ENTRIES) {
      fs.rmSync(path.join(app, entry), { recursive: true, force: true })
      fs.cpSync(path.join(fixtureDir, entry), path.join(app, entry), {
        recursive: true,
      })
    }
} else if (cmd === "restore") {
  for (const app of APPS) {
    execFileSync("git", ["checkout", "--", ...ENTRIES], {
      cwd: app,
      stdio: "inherit",
    })
    execFileSync("git", ["clean", "-fdq", "--", "schema"], {
      cwd: app,
      stdio: "inherit",
    })
  }
} else {
  throw new Error("usage: fixture.mjs apply <dir> | restore")
}

import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = join(__dirname, "..", "..")
const OUT_DIR = join(TEMPLATE_DIR, "out")
const CONFIG_PATH = join(TEMPLATE_DIR, "data", "config.json")
const FIXTURES_DIR = join(TEMPLATE_DIR, "tests", "fixtures")

const run = (command: string, args: string[], cwd: string, timeout: number) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    timeout,
    env: {
      ...process.env,
      // dd-trace (loaded via NODE_OPTIONS in CI) breaks spawned subprocesses.
      NODE_OPTIONS: "",
    },
  })

  if (result.error || result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} exited with ${result.status} (${result.error}):\n${result.stdout}\n${result.stderr}`,
    )
  }
}

export const readTemplateConfig = () => readFileSync(CONFIG_PATH, "utf-8")

export const writeTemplateConfig = (config: string) => {
  writeFileSync(CONFIG_PATH, config, "utf-8")
}

export const readConfigFixture = (name: string) => {
  const fixturePath = join(FIXTURES_DIR, `config.${name}.json`)
  if (!existsSync(fixturePath)) {
    throw new Error(`Missing config fixture: ${fixturePath}`)
  }
  return readFileSync(fixturePath, "utf-8")
}

export const buildTemplate = () => {
  rmSync(join(TEMPLATE_DIR, ".next"), { recursive: true, force: true })
  rmSync(OUT_DIR, { recursive: true, force: true })

  run("pnpm", ["run", "build:template"], TEMPLATE_DIR, 600_000)

  return OUT_DIR
}

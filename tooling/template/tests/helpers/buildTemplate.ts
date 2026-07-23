import { spawnSync } from "node:child_process"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = join(__dirname, "..", "..")
const WORKSPACE_ROOT = join(TEMPLATE_DIR, "..", "..")
const OUT_DIR = join(TEMPLATE_DIR, "out")
const CONFIG_PATH = join(TEMPLATE_DIR, "data", "config.json")
const FIXTURES_DIR = join(TEMPLATE_DIR, "tests", "fixtures")

let originalConfig: string | null = null
let componentsBuilt = false

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

const ensureComponentsBuilt = () => {
  if (componentsBuilt) return

  run(
    "pnpm",
    ["--filter", "@opengovsg/isomer-components", "run", "build:module"],
    WORKSPACE_ROOT,
    300_000,
  )
  componentsBuilt = true
}

export const restoreTemplateConfig = () => {
  if (originalConfig === null) return
  writeFileSync(CONFIG_PATH, originalConfig, "utf-8")
  originalConfig = null
}

export const buildTemplate = ({
  configFixture,
}: {
  configFixture?: string
} = {}) => {
  ensureComponentsBuilt()

  originalConfig ??= readFileSync(CONFIG_PATH, "utf-8")

  if (configFixture) {
    const fixturePath = join(FIXTURES_DIR, `config.${configFixture}.json`)
    if (!existsSync(fixturePath)) {
      throw new Error(`Missing config fixture: ${fixturePath}`)
    }
    writeFileSync(CONFIG_PATH, readFileSync(fixturePath, "utf-8"), "utf-8")
  } else {
    writeFileSync(CONFIG_PATH, originalConfig, "utf-8")
  }

  rmSync(join(TEMPLATE_DIR, ".next"), { recursive: true, force: true })
  rmSync(OUT_DIR, { recursive: true, force: true })

  run("pnpm", ["run", "build:template"], TEMPLATE_DIR, 600_000)

  return OUT_DIR
}

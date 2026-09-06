import { spawnSync } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"

const TEMPLATE_DIR = path.join(import.meta.dirname, "..", "..")
const OUT_DIR = path.join(TEMPLATE_DIR, "out")
const CONFIG_PATH = path.join(TEMPLATE_DIR, "data", "config.json")

interface TemplateSearchConfig {
  type: string
  appId?: string
  searchApiKey?: string
  indexName?: string
  searchUrl?: string
}

interface TemplateSiteConfig {
  siteName: string
  url: string
  agencyName?: string
  theme?: string
  logoUrl?: string
  favicon?: string
  isGovernment?: boolean
  search?: TemplateSearchConfig
}

interface TemplateConfig {
  site: TemplateSiteConfig
}

const run = (command: string, args: string[], cwd: string, timeout: number) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      // dd-trace (loaded via NODE_OPTIONS in CI) breaks spawned subprocesses.
      NODE_OPTIONS: "",
    },
    timeout,
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

export const withTemplateConfig = (
  baseConfig: string,
  update: (config: TemplateConfig) => void,
) => {
  // SAFETY: tooling/template data/config.json is owned by this package and matches TemplateConfig
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- owned template config fixture
  const config = JSON.parse(baseConfig) as TemplateConfig
  update(config)
  return `${JSON.stringify(config, null, 2)}\n`
}

export const buildTemplate = () => {
  rmSync(path.join(TEMPLATE_DIR, ".next"), { force: true, recursive: true })
  rmSync(OUT_DIR, { force: true, recursive: true })

  run("pnpm", ["run", "build:template"], TEMPLATE_DIR, 600_000)

  return OUT_DIR
}

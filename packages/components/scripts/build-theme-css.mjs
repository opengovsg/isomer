import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import postcss from "postcss"
import tailwindcss from "tailwindcss"
import loadConfig from "tailwindcss/loadConfig.js"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const { ISOMER_THEMES } = loadConfig(
  resolve(packageRoot, "src/themes/index.ts"),
)
const { createThemePreset } = loadConfig(
  resolve(packageRoot, "src/presets/theme.ts"),
)
const config = loadConfig(
  resolve(
    existsSync("tailwind.config.ts")
      ? "tailwind.config.ts"
      : "tailwind.config.js",
  ),
)
const output = resolve(process.argv[2])
await mkdir(output, { recursive: true })

for (const [id, theme] of Object.entries(ISOMER_THEMES)) {
  // The existing host overrides belong to Next. Other themes inherit only the shared preset.
  const themeConfig = {
    ...config,
    theme: id === "isomer-next" ? config.theme : {},
    presets: [createThemePreset(id)],
  }
  const css = await postcss([tailwindcss(themeConfig)]).process(
    "@tailwind base;\n@tailwind components;\n@tailwind utilities;",
    { from: undefined },
  )
  const fontImport = theme.fontStylesheet
    ? `@import url("${theme.fontStylesheet}");\n`
    : ""
  await writeFile(resolve(output, `${id}.css`), fontImport + css.css)
  console.log(`Built ${id}.css`)
}

import { spawnSync } from "node:child_process"

/**
 * Strip Datadog/dd-trace preloads from NODE_OPTIONS while keeping heap and
 * other Node flags (e.g. --max-old-space-size from publishing workers).
 */
const stripInstrumentationFromNodeOptions = (nodeOptions) => {
  if (!nodeOptions?.trim()) {
    return ""
  }

  const tokens =
    nodeOptions.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []
  const kept = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token === "-r" || token === "--require") {
      const modulePath = tokens[++i]
      if (modulePath?.includes("dd-trace")) {
        continue
      }
      kept.push(token, modulePath)
      continue
    }

    if (token === "--import" || token === "--experimental-loader") {
      const modulePath = tokens[++i]
      if (modulePath?.includes("dd-trace")) {
        continue
      }
      kept.push(token, modulePath)
      continue
    }

    kept.push(token)
  }

  return kept.join(" ").trim()
}

const [command, ...args] = process.argv.slice(2)
if (!command) {
  console.error(
    "Usage: node run-without-node-preload.mjs <command> [args...]",
  )
  process.exit(1)
}

const result = spawnSync(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: stripInstrumentationFromNodeOptions(process.env.NODE_OPTIONS),
  },
  shell: process.platform === "win32",
})

process.exit(result.status ?? 1)

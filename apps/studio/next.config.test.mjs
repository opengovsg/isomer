// Run with: node --test apps/studio/next.config.test.mjs
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { test } from "node:test"

test("only staging relaxes COOP, including in production builds", () => {
  for (const nodeEnv of /** @type {const} */ (["development", "production"])) {
    for (const appEnv of [
      "staging",
      "production",
      "uat",
      "development",
      "preview",
      "vapt",
      "test",
      undefined,
    ]) {
      const header = execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `
        const { default: config } = await import('./next.config.mjs')
        const rules = await config.headers()
        console.log(rules[0].headers.find(h => h.key === 'Cross-Origin-Opener-Policy').value)
      `,
        ],
        {
          cwd: new URL(".", import.meta.url),
          // Isolate configuration evaluation from credentials and local .env files.
          env: {
            SKIP_ENV_VALIDATION: "true",
            NODE_ENV: nodeEnv,
            ...(appEnv ? { NEXT_PUBLIC_APP_ENV: appEnv } : {}),
          },
          encoding: "utf8",
        },
      ).trim()
      assert.equal(
        header,
        appEnv === "staging" ? "unsafe-none" : "same-origin",
        `${nodeEnv}/${appEnv}`,
      )
    }
  }
})

#!/usr/bin/env node
// Browser driver for Isomer Studio (apps/studio).
//
// chromium-cli is not available in this container and Playwright's CDN is
// blocked by the network policy, so this driver talks to playwright-core
// directly against the chromium that ships pre-installed at /opt/pw-browsers.
//
// It mints a valid iron-session cookie for a seeded user (Studio has no
// usable login flow here: email-OTP needs Postman and Singpass needs the
// rate-limited mockpass container), sets it on the browser context, then
// navigates and screenshots. This is the only way to reach authed pages.
//
// Usage (run from apps/studio so node resolves playwright-core/iron-session/pg):
//   node .claude/skills/run-studio/driver.mjs smoke
//   node .claude/skills/run-studio/driver.mjs shot /sites/1 /tmp/site.png
//   node .claude/skills/run-studio/driver.mjs shot /sign-in /tmp/signin.png --no-auth
//
// Flags: --user <email> (default editor@open.gov.sg), --base <url>
//        (default http://localhost:3000), --no-auth (skip cookie).
//
// Screenshots default to apps/studio/.claude/skills/run-studio/screenshots/.

import { chromium } from "@playwright/test"
import { sealData } from "iron-session"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { globSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { Client } from "pg"

const HERE = dirname(fileURLToPath(import.meta.url))
const STUDIO = resolve(HERE, "../../..") // apps/studio (run-studio/skills/.claude/studio)
const SHOT_DIR = join(HERE, "screenshots")

// ---- args ----------------------------------------------------------------
const argv = process.argv.slice(2)
const positional = argv.filter((a) => !a.startsWith("--"))
const cmd = positional[0] ?? "smoke"
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : def
}
const noAuth = argv.includes("--no-auth")
const base = flag("base", "http://localhost:3000").replace(/\/$/, "")
const user = flag("user", "editor@open.gov.sg")

// ---- read .env (SESSION_SECRET, DATABASE_URL) ----------------------------
function readEnv() {
  // oxlint-disable-next-line node/no-process-env
  const out = { ...process.env }
  const envFile = join(STUDIO, ".env")
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let v = m[2]
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1)
      if (out[m[1]] === undefined) out[m[1]] = v
    }
  }
  return out
}
const ENV = readEnv()

// ---- locate the pre-installed chromium -----------------------------------
function findChromium() {
  if (ENV.CHROMIUM_PATH && existsSync(ENV.CHROMIUM_PATH))
    return ENV.CHROMIUM_PATH
  const hits = globSync("/opt/pw-browsers/chromium-*/chrome-linux/chrome")
  if (hits.length) return hits.sort().pop()
  throw new Error(
    "No chromium found under /opt/pw-browsers. Set CHROMIUM_PATH to a chrome binary.",
  )
}

// ---- mint the session cookie ---------------------------------------------
async function mintCookie(email) {
  const secret = ENV.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET not found in env or .env")
  const dbUrl = ENV.DATABASE_URL
  if (!dbUrl) throw new Error("DATABASE_URL not found in env or .env")
  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  const { rows } = await client.query(
    'select id from "User" where email = $1 and "deletedAt" is null limit 1',
    [email],
  )
  await client.end()
  if (!rows.length)
    throw new Error(`No user with email ${email} (seed the DB?)`)
  const userId = rows[0].id
  const sealed = await sealData(
    { userId },
    { password: { 1: secret }, ttl: 60 * 60 },
  )
  return { value: sealed, userId }
}

// ---- main ----------------------------------------------------------------
async function main() {
  mkdirSync(SHOT_DIR, { recursive: true })
  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })

  if (!noAuth) {
    const { value, userId } = await mintCookie(user)
    await context.addCookies([
      {
        name: "auth.session-token",
        value,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ])
    // Studio's page guard (EnforceLoginStatePageWrapper) gates the UI on a
    // localStorage flag, NOT the cookie. Set it or every authed page bounces
    // to /sign-in even with a valid session cookie.
    await context.addInitScript(() => {
      try {
        localStorage.setItem("is-logged-in", "true")
      } catch {}
    })
    console.log(`auth: ${user} (userId=${userId})`)
  } else {
    console.log("auth: none (--no-auth)")
  }

  const page = await context.newPage()
  const errors = []
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  page.on("pageerror", (e) => errors.push(String(e)))

  const visit = async (path, out) => {
    const url = base + path
    process.stdout.write(`nav ${url} ... `)
    const resp = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    })
    await page
      .waitForLoadState("networkidle", { timeout: 30000 })
      .catch(() => {})
    const file =
      out || join(SHOT_DIR, (path.replace(/\W+/g, "_") || "root") + ".png")
    await page.screenshot({ path: file, fullPage: true })
    console.log(
      `HTTP ${resp ? resp.status() : "?"} | title="${await page.title()}" -> ${file}`,
    )
    return resp
  }

  let ok = true
  if (cmd === "shot") {
    const path = positional[1] ?? "/"
    await visit(path, positional[2])
  } else if (cmd === "smoke") {
    await visit("/") // authed dashboard (site list)
    await visit("/sites/1") // site dashboard
  } else {
    console.error(`Unknown command: ${cmd}`)
    ok = false
  }

  if (errors.length) {
    console.log(`\nconsole/page errors (${errors.length}):`)
    for (const e of errors.slice(0, 15)) console.log("  ! " + e)
  } else {
    console.log("\nno console errors")
  }

  await browser.close()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

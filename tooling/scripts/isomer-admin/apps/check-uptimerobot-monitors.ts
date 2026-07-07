/**
 * Check that every LAUNCHED site has an UptimeRobot monitor, and optionally
 * fix what's missing.
 *
 * Before running:
 *   1. Set UPTIMEROBOT_API_KEY in `.env` to a UptimeRobot Main API Key. Read
 *      access is sufficient for the analysis; if you confirm either
 *      remediation prompt below, the key also needs write access.
 *   2. Copy `sites.production.csv` into this `isomer-admin` folder.
 *
 * Reads `sites.production.csv`, filters to sites with state LAUNCHED, and
 * cross-references their `domainAliases` against all monitors in the
 * UptimeRobot account.
 *
 * For sites whose domain starts with "www.", the monitor is expected to
 * target the apex domain (e.g. `domain.com`, not `www.domain.com`) so that
 * the www redirect is exercised by the check. A site with a monitor only on
 * the www domain is flagged separately from one with no monitor at all.
 *
 * After the analysis, you'll be prompted to:
 *   1. Create a new monitor for every site with none.
 *   2. Update every www-only monitor to target the apex domain instead
 *      (edits the existing monitor rather than creating a duplicate).
 */
import { confirm } from "@inquirer/prompts"
import fs from "fs"
import path from "path"

interface SiteRow {
  siteName: string
  shortName: string
  siteId: string
  state: string
  instanceType: string
  domainAliases: string
}

interface UptimeRobotMonitor {
  id: number
  friendly_name: string
  url: string
}

interface UptimeRobotGetMonitorsResponse {
  stat: string
  pagination: { offset: number; limit: number; total: number }
  monitors: UptimeRobotMonitor[]
}

const UPTIMEROBOT_API_URL = "https://api.uptimerobot.com/v2/getMonitors"
const PAGE_SIZE = 50
const OUTPUT_PATH = "uptimerobot-monitor-check.txt"
const UPTIMEROBOT_NEW_MONITOR_URL = "https://api.uptimerobot.com/v2/newMonitor"
const UPTIMEROBOT_EDIT_MONITOR_URL =
  "https://api.uptimerobot.com/v2/editMonitor"
const MONITOR_TYPE_HTTP = "1"
const MONITOR_INTERVAL_SECONDS = "30"
const MONITOR_ALERT_CONTACTS = "8266125_0_0-2903203_0_0-3653899_0_0"
const DELAY_BETWEEN_CALLS_MS = 1000

const parseSitesCsv = (csvPath: string): SiteRow[] => {
  const content = fs.readFileSync(csvPath, "utf-8")
  const [, ...lines] = content.trim().split(/\r?\n/)

  return lines.map((line) => {
    const [siteName, shortName, siteId, state, instanceType, domainAliases] =
      line.split(",")
    return {
      siteName: siteName ?? "",
      shortName: shortName ?? "",
      siteId: siteId ?? "",
      state: state ?? "",
      instanceType: instanceType ?? "",
      domainAliases: domainAliases ?? "",
    }
  })
}

const fetchAllMonitors = async (
  apiKey: string,
): Promise<UptimeRobotMonitor[]> => {
  const monitors: UptimeRobotMonitor[] = []
  let offset = 0

  for (;;) {
    const response = await fetch(UPTIMEROBOT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        api_key: apiKey,
        format: "json",
        offset: String(offset),
        limit: String(PAGE_SIZE),
      }),
    })

    const data = (await response.json()) as UptimeRobotGetMonitorsResponse

    if (data.stat !== "ok") {
      throw new Error(`UptimeRobot API error: ${JSON.stringify(data)}`)
    }

    monitors.push(...data.monitors)
    offset += PAGE_SIZE

    if (offset >= data.pagination.total) break
  }

  return monitors
}

const extractHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

const resolveApexHost = (domain: string): string =>
  domain.startsWith("www.") ? domain.slice("www.".length) : domain

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

interface UptimeRobotMutationResponse {
  stat: string
  error?: { message: string }
}

type MutationResult = { ok: true } | { ok: false; error: string }

const createMonitorForHost = async (
  apiKey: string,
  host: string,
): Promise<MutationResult> => {
  const response = await fetch(UPTIMEROBOT_NEW_MONITOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      api_key: apiKey,
      format: "json",
      type: MONITOR_TYPE_HTTP,
      url: `https://${host}`,
      friendly_name: host,
      interval: MONITOR_INTERVAL_SECONDS,
      alert_contacts: MONITOR_ALERT_CONTACTS,
    }),
  })

  const data = (await response.json()) as UptimeRobotMutationResponse
  if (data.stat !== "ok") {
    return { ok: false, error: data.error?.message ?? JSON.stringify(data) }
  }
  return { ok: true }
}

const editMonitorToApex = async (
  apiKey: string,
  monitorId: number,
  apexHost: string,
): Promise<MutationResult> => {
  const response = await fetch(UPTIMEROBOT_EDIT_MONITOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      api_key: apiKey,
      format: "json",
      id: String(monitorId),
      url: `https://${apexHost}`,
      friendly_name: apexHost,
    }),
  })

  const data = (await response.json()) as UptimeRobotMutationResponse
  if (data.stat !== "ok") {
    return { ok: false, error: data.error?.message ?? JSON.stringify(data) }
  }
  return { ok: true }
}

export const checkUptimeRobotMonitors = async (): Promise<void> => {
  const apiKey = process.env.UPTIMEROBOT_API_KEY
  if (!apiKey) {
    console.error(
      "Missing UPTIMEROBOT_API_KEY. Add it to tooling/scripts/isomer-admin/.env",
    )
    return
  }

  const csvPath = path.join(__dirname, "..", "sites.production.csv")
  const launchedSites = parseSitesCsv(csvPath).filter(
    (site) => site.state === "LAUNCHED",
  )
  console.log(`Loaded ${launchedSites.length} LAUNCHED site(s) from CSV.`)

  console.log("Fetching monitors from UptimeRobot...")
  const monitors = await fetchAllMonitors(apiKey)
  const monitorsByHostname = new Map<string, UptimeRobotMonitor>()
  for (const monitor of monitors) {
    const hostname = extractHostname(monitor.url)
    if (hostname) monitorsByHostname.set(hostname, monitor)
  }
  console.log(
    `Found ${monitorsByHostname.size} unique monitored hostname(s) across ${monitors.length} monitor(s).\n`,
  )

  const missing: SiteRow[] = []
  const wwwInsteadOfApex: SiteRow[] = []

  for (const site of launchedSites) {
    const domain = site.domainAliases.trim().toLowerCase()
    if (!domain) continue

    if (domain.startsWith("www.")) {
      const apex = domain.slice("www.".length)
      const hasWwwMonitor = monitorsByHostname.has(domain)
      const hasApexMonitor = monitorsByHostname.has(apex)

      if (!hasWwwMonitor && !hasApexMonitor) {
        missing.push(site)
      } else if (hasWwwMonitor && !hasApexMonitor) {
        wwwInsteadOfApex.push(site)
      }
    } else if (!monitorsByHostname.has(domain)) {
      missing.push(site)
    }
  }

  const lines: string[] = []

  lines.push(`=== Missing monitors (${missing.length}) ===`)
  for (const site of missing) {
    lines.push(
      `[${site.siteId}] ${site.siteName} (${site.shortName}) — ${site.domainAliases}`,
    )
  }

  lines.push("")
  lines.push(
    `=== Monitoring www instead of apex — redirect not verified (${wwwInsteadOfApex.length}) ===`,
  )
  for (const site of wwwInsteadOfApex) {
    const apex = site.domainAliases.trim().toLowerCase().slice("www.".length)
    lines.push(
      `[${site.siteId}] ${site.siteName} (${site.shortName}) — has monitor for ${site.domainAliases}, missing one for ${apex}`,
    )
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf-8")
  console.log(lines.join("\n"))
  console.log(`\nResults written to ${OUTPUT_PATH}`)

  const remediationLines: string[] = []

  if (missing.length > 0) {
    const shouldCreate = await confirm({
      message: `Create UptimeRobot monitors for all ${missing.length} missing site(s)?`,
      default: false,
    })

    if (shouldCreate) {
      for (let i = 0; i < missing.length; i++) {
        const site = missing[i]!
        const domain = site.domainAliases.trim().toLowerCase()
        const host = resolveApexHost(domain)
        let result: MutationResult
        try {
          result = await createMonitorForHost(apiKey, host)
        } catch (err) {
          result = {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          }
        }

        const line = result.ok
          ? `[created] [${site.siteId}] ${site.siteName} — ${host}`
          : `[error] [${site.siteId}] ${site.siteName} — ${host} — ${result.error}`
        console.log(line)
        remediationLines.push(line)

        if (i < missing.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS)
      }
    } else {
      console.log("Skipped creating monitors for missing sites.")
    }
  }

  if (wwwInsteadOfApex.length > 0) {
    const shouldFix = await confirm({
      message: `Update ${wwwInsteadOfApex.length} www monitor(s) to target the apex domain instead?`,
      default: false,
    })

    if (shouldFix) {
      for (let i = 0; i < wwwInsteadOfApex.length; i++) {
        const site = wwwInsteadOfApex[i]!
        const domain = site.domainAliases.trim().toLowerCase()
        const apexHost = resolveApexHost(domain)
        const wwwMonitor = monitorsByHostname.get(domain)

        if (!wwwMonitor) {
          const line = `[error] [${site.siteId}] ${site.siteName} — could not find existing monitor for ${domain}`
          console.log(line)
          remediationLines.push(line)
          continue
        }

        let result: MutationResult
        try {
          result = await editMonitorToApex(apiKey, wwwMonitor.id, apexHost)
        } catch (err) {
          result = {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          }
        }

        const line = result.ok
          ? `[updated] [${site.siteId}] ${site.siteName} — ${domain} -> ${apexHost}`
          : `[error] [${site.siteId}] ${site.siteName} — ${domain} -> ${apexHost} — ${result.error}`
        console.log(line)
        remediationLines.push(line)

        if (i < wwwInsteadOfApex.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS)
      }
    } else {
      console.log("Skipped updating www monitors.")
    }
  }

  if (remediationLines.length > 0) {
    fs.appendFileSync(
      OUTPUT_PATH,
      `\n\n=== Remediation actions ===\n${remediationLines.join("\n")}\n`,
      "utf-8",
    )
  }
}

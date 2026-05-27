import { getRobotsTxt } from "@opengovsg/isomer-components"
/**
 * Pre-build script: generates public/robots.txt from data/config.json.
 *
 * Waku has no MetadataRoute.Robots convention (unlike Next.js app/robots.ts),
 * so we generate the file statically and let Waku serve it from public/.
 *
 * Run via `tsx scripts/generate-robots.ts` before `waku build`.
 */
import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

import config from "../data/config.json"

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, "..", "public")
mkdirSync(publicDir, { recursive: true })

// NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT overrides config.site.environment at
// runtime so staging/prod deployments get different crawl rules without
// rebuilding the data layer.
const robotsData = getRobotsTxt({
  // @ts-expect-error partial schema — only site props are read
  site: {
    ...config.site,
    environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
  },
})

const robotsLines: string[] = []
for (const rule of robotsData.rules) {
  const agents = Array.isArray(rule.userAgent)
    ? rule.userAgent
    : [rule.userAgent]
  for (const agent of agents) robotsLines.push(`User-agent: ${agent}`)
  if (rule.allow) {
    const allows = Array.isArray(rule.allow) ? rule.allow : [rule.allow]
    for (const a of allows) robotsLines.push(`Allow: ${a}`)
  }
  if (rule.disallow) {
    const disallows = Array.isArray(rule.disallow)
      ? rule.disallow
      : [rule.disallow]
    for (const d of disallows) robotsLines.push(`Disallow: ${d}`)
  }
  robotsLines.push("") // blank line between rule blocks (robots.txt spec)
}
if (robotsData.sitemap) robotsLines.push(`Sitemap: ${robotsData.sitemap}`)

writeFileSync(
  join(publicDir, "robots.txt"),
  robotsLines.join("\n").trimEnd() + "\n",
  "utf8",
)
console.log("✓ public/robots.txt written")

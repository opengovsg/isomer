import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { getRobotsTxt } from "@opengovsg/isomer-components"

import { siteProps } from "../lib/site"

const lines = (key: string, value?: string | string[]) =>
  [value ?? []].flat().map((v) => `${key}: ${v}`)

// Same rules as apps/template/app/robots.ts, serialised like Next's MetadataRoute.Robots.
export const GET = () => {
  const robots = getRobotsTxt({
    site: siteProps,
  } as unknown as IsomerPageSchemaType)
  const body = [
    ...robots.rules.flatMap((rule) => [
      ...lines("User-Agent", rule.userAgent),
      ...lines("Allow", "allow" in rule ? rule.allow : undefined),
      ...lines("Disallow", rule.disallow),
      "",
    ]),
    ...lines("Sitemap", robots.sitemap),
  ].join("\n")
  return new Response(`${body}\n`, {
    headers: { "Content-Type": "text/plain" },
  })
}

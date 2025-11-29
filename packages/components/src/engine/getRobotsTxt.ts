import type { IsomerPageSchemaType } from "~/types"
import { shouldBlockIndexing } from "./shouldBlockIndexing"

export const getRobotsTxt = (props: IsomerPageSchemaType) => {
  const rules = [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/search"],
    },
  ]

  return {
    sitemap: props.site.url ? `${props.site.url}/sitemap.xml` : undefined,
    rules: shouldBlockIndexing(props.site.environment)
      ? {
          userAgent: "*",
          disallow: "/",
        }
      : rules,
  }
}

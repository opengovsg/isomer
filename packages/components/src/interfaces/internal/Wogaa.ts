import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"

export interface WogaaProps {
  environment: IsomerSiteProps["environment"]
}

export interface WogaaSentimentTriggerProps {
  site: Pick<
    IsomerSiteProps,
    "url" | "footerItems" | "siteMapArray" | "assetsBaseUrl"
  >
  layout: IsomerPageLayoutType
  permalink: string
}

export interface WogaaSentimentTriggerClientProps {
  delayMs: number
  // Fraction of the page (0 to 1) the visitor must scroll through
  scrollDepthThreshold: number
}

import type { IsomerSiteProps } from "~/types"

export interface PolyglotProps {
  environment: IsomerSiteProps["environment"]
}

export interface PolyglotClientProps {
  scriptUrl: string
}

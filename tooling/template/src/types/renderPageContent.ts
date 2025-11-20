import type { IsomerComponent, IsomerPageLayoutType, IsomerSiteProps, LinkComponentType } from "@opengovsg/isomer-components"

export interface RenderPageContentParams {
  content: IsomerComponent[]
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent: LinkComponentType
  permalink: string
}
import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
  LinkComponentType,
} from "~/types"

export interface RenderPageContentParams {
  content: IsomerComponent[]
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent: LinkComponentType
  permalink: string
}

export interface RenderComponentProps {
  elementKey?: number
  component: IsomerComponent
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  shouldLazyLoad?: boolean
  permalink: string
}

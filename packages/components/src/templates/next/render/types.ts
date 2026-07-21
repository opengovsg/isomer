import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
} from "~/types"

export interface RenderPageContentParams {
  content: IsomerComponent[]
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  permalink: string
}

export type RenderPageContentOutput = JSX.Element[]

export interface RenderComponentProps {
  elementKey?: number
  component: IsomerComponent
  layout: IsomerPageLayoutType
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
  permalink: string
}

export type RenderComponentOutput = JSX.Element

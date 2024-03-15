import type {
  ButtonProps,
  CalloutProps,
  CardsProps,
  ContentProps,
  FooterProps,
  HeaderProps,
  ImageProps,
  InfoCardsProps,
  InfoColsProps,
  InfobarProps,
  InfopicProps,
  KeyStatisticsProps,
  MastheadProps,
  ParagraphProps,
  SearchProps,
  SidePaneProps,
} from "~/common"

type IsomerComponentProps =
  | ButtonProps
  | CalloutProps
  | CardsProps
  | ContentProps
  | FooterProps
  | HeaderProps
  | ImageProps
  | InfobarProps
  | InfoCardsProps
  | InfoColsProps
  | InfopicProps
  | KeyStatisticsProps
  | MastheadProps
  | ParagraphProps
  | SearchProps
  | SidePaneProps

export type IsomerComponent = IsomerComponentProps & {
  sectionIdx?: number
  indexable?: string[]
}

interface IsomerSitemap {
  title: string
  permalink: string
  children?: IsomerSitemap[]
}

interface IsomerSiteProps {
  siteName: string
  siteMap: IsomerSitemap[]
  theme: "classic" | "next"
  language: "en"
}

interface IsomerPageProps {
  layout: "homepage" | "content"
  title?: string
  description?: string
  noIndex?: boolean
}

export interface IsomerPageSchema {
  site: IsomerSiteProps
  page: IsomerPageProps
  content: IsomerComponent[]
  LinkComponent?: any // Next.js link
}

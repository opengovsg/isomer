import type {
  ButtonProps,
  CalloutProps,
  CardsProps,
  ContentPageHeaderProps,
  ContentProps,
  FooterProps,
  HeaderProps,
  HeroProps,
  ImageProps,
  InfoCardsProps,
  InfoColsProps,
  InfobarProps,
  InfopicProps,
  KeyStatisticsProps,
  MastheadProps,
  NavbarProps,
  OrderedListProps,
  ParagraphProps,
  SearchProps,
  SidePaneProps,
  TableOfContentsProps,
  UnorderedListProps,
} from "~/common"

type IsomerComponentProps =
  | ButtonProps
  | CalloutProps
  | CardsProps
  | ContentProps
  | ContentPageHeaderProps
  | FooterProps
  | HeaderProps
  | HeroProps
  | ImageProps
  | InfobarProps
  | InfoCardsProps
  | InfoColsProps
  | InfopicProps
  | KeyStatisticsProps
  | MastheadProps
  | NavbarProps
  | OrderedListProps
  | ParagraphProps
  | SearchProps
  | SidePaneProps
  | TableOfContentsProps
  | UnorderedListProps

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
  logoUrl: string
  isGovernment?: boolean
  environment?: "staging" | "production"
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

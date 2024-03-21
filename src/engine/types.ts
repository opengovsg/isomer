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
import { SiteConfigFooterProps } from "~/common/Footer"

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
  agencyName?: string
  siteMap: IsomerSitemap[]
  theme: "classic" | "next"
  logoUrl: string
  isGovernment?: boolean
  environment?: "staging" | "production"
  navBarItems: NavbarProps["items"]
  footerItems: SiteConfigFooterProps
}

interface IsomerPageProps {
  layout: "homepage" | "content"
  language?: "en"
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

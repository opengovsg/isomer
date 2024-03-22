import type {
  ButtonProps,
  CalloutProps,
  CardsProps,
  ContentPageHeaderProps,
  ContentProps,
  FooterProps,
  HeaderProps,
  HeadingProps,
  HeroProps,
  ImageProps,
  InfoCardsProps,
  InfoColsProps,
  InfobarProps,
  InfopicProps,
  KeyStatisticsProps,
  MastheadProps,
  MetaHeadProps,
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
  | HeadingProps
  | HeaderProps
  | HeroProps
  | ImageProps
  | InfobarProps
  | InfoCardsProps
  | InfoColsProps
  | InfopicProps
  | KeyStatisticsProps
  | MastheadProps
  | MetaHeadProps
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

export type IsomerLayout = "homepage" | "content"

interface IsomerSitemap {
  title: string
  permalink: string
  children?: IsomerSitemap[]
}

interface IsomerSiteProps {
  siteName: string
  agencyName?: string
  siteMap: IsomerSitemap[]
  theme: "isomer-classic" | "isomer-next"
  logoUrl: string
  isGovernment?: boolean
  environment?: string
  favicon?: MetaHeadProps["favicon"]
  navBarItems: NavbarProps["items"]
  footerItems: SiteConfigFooterProps
}

interface IsomerPageProps {
  layout: IsomerLayout
  language?: "en"
  title?: MetaHeadProps["title"]
  description?: MetaHeadProps["description"]
  noIndex?: MetaHeadProps["noIndex"]
}

export interface IsomerPageSchema {
  site: IsomerSiteProps
  page: IsomerPageProps
  content: IsomerComponent[]
  LinkComponent?: any // Next.js link
}

export interface IsomerMetaHeadSchema {
  site: Pick<IsomerSiteProps, "theme" | "favicon" | "siteName">
  page: Pick<IsomerPageProps, "title" | "description" | "noIndex" | "layout">
  HeadComponent?: any // Next.js head
}

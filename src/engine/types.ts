import type {
  ButtonProps,
  CalloutProps,
  CardsProps,
  CollectionCardProps,
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
  SiderailProps,
  TableOfContentsProps,
  UnorderedListProps,
} from "~/common"
import { SortDirection, SortKey } from "~/common/CollectionSort"
import { SiteConfigFooterProps } from "~/common/Footer"

type IsomerComponentProps =
  | ButtonProps
  | CalloutProps
  | CollectionCardProps
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
  | SiderailProps
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
  theme: "isomer-classic" | "isomer-next"
  logoUrl: string
  isGovernment?: boolean
  environment?: string
  favicon?: MetaHeadProps["favicon"]
  navBarItems: NavbarProps["items"]
  footerItems: SiteConfigFooterProps
}

interface BasePageProps {
  title: string
  language?: "en"
  description?: string
  noIndex?: boolean
}
export interface HomePageProps extends BasePageProps {}
export interface ContentPageProps extends BasePageProps {}
export interface CollectionPageProps extends BasePageProps {
  defaultSortBy: SortKey
  defaultSortDirection: SortDirection
  items: CollectionCardProps[]
  subtitle: string
}

export interface BasePageSchema {
  version: string
  site: IsomerSiteProps
  content: IsomerComponent[]
  LinkComponent?: any // Next.js link
  HeadComponent?: any // Next.js head
}

export interface HomePageSchema extends BasePageSchema {
  layout: "homepage"
  page: HomePageProps
}
export interface ContentPageSchema extends BasePageSchema {
  layout: "content"
  page: ContentPageProps
}

export interface CollectionPageSchema extends BasePageSchema {
  layout: "collection"
  page: CollectionPageProps
}

export type IsomerPageSchema =
  | HomePageSchema
  | ContentPageSchema
  | CollectionPageSchema

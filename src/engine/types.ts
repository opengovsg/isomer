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
  | SiderailProps
  | TableOfContentsProps
  | UnorderedListProps

export type IsomerComponent = IsomerComponentProps & {
  sectionIdx?: number
  indexable?: string[]
}

export type IsomerLayout = "homepage" | "content" | "collection"

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

interface HomePageProps {}
interface ContentPageProps {}
interface CollectionPageProps {
  defaultSort: "date-asc" | "date-desc"
  items: CollectionCardProps[]
  title: string
  subtitle: string
  // TODO: add in props for filter
}

export interface BasePageSchema {
  version: string
  site: IsomerSiteProps
  meta: MetaHeadProps
  content: IsomerComponent[]
  LinkComponent?: any // Next.js link
  HeadComponent?: any // Next.js head
}

export interface HomePageSchema extends BasePageSchema {
  layout: "homepage"
  props: HomePageProps
}

export interface ContentPageSchema extends BasePageSchema {
  layout: "content"
  props: ContentPageProps
}

export interface CollectionPageSchema extends BasePageSchema {
  layout: "collection"
  props: CollectionPageProps
}

export type IsomerPageSchema =
  | HomePageSchema
  | ContentPageSchema
  | CollectionPageSchema
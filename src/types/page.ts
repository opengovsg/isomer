import type {
  ArticlePageHeaderProps,
  CollectionCardProps,
  ContentPageHeaderProps,
} from "~/common"
import type { SortDirection, SortKey } from "~/common/CollectionSort"

interface BaseItemProps {
  permalink: string
  title: string
  description?: string
}

interface BasePageProps extends BaseItemProps {
  language?: "en"
  noIndex?: boolean
}

interface BaseRefProps extends BaseItemProps {
  ref: string
  category: CollectionCardProps["category"]
  date: CollectionCardProps["lastUpdated"]
  image?: CollectionCardProps["image"]
}

export interface FileRefProps extends BaseRefProps {}
export interface LinkRefProps extends BaseRefProps {}

export interface ArticlePageProps extends BasePageProps {
  category: CollectionCardProps["category"]
  date: CollectionCardProps["lastUpdated"]
  image?: CollectionCardProps["image"]
  articlePageHeader: Pick<ArticlePageHeaderProps, "summary">
}
export interface CollectionPageProps extends BasePageProps {
  defaultSortBy: SortKey
  defaultSortDirection: SortDirection
  subtitle: string
}
export interface ContentPageProps extends BasePageProps {
  contentPageHeader: Pick<
    ContentPageHeaderProps,
    "summary" | "buttonLabel" | "buttonUrl"
  >
}
export interface HomePageProps extends BasePageProps {}
export interface NotFoundPageProps extends BasePageProps {}
export interface SearchPageProps extends BasePageProps {}

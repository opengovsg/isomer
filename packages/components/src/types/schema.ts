import type { IsomerComponent } from "./components";
import type {
  ArticlePageProps,
  CollectionPageProps,
  ContentPageProps,
  FileRefProps,
  HomePageProps,
  LinkRefProps,
  NotFoundPageProps,
  SearchPageProps,
} from "./page";
import type { IsomerSiteProps } from "./site";

interface BasePageSchema {
  version: string;
  site: IsomerSiteProps;
  content: IsomerComponent[];
  LinkComponent?: any; // Next.js link
  ScriptComponent?: any; // Next.js script
}

export interface ArticlePageSchema extends BasePageSchema {
  layout: "article";
  page: ArticlePageProps;
}

export interface CollectionPageSchema extends BasePageSchema {
  layout: "collection";
  page: CollectionPageProps;
}

export interface ContentPageSchema extends BasePageSchema {
  layout: "content";
  page: ContentPageProps;
}

export interface HomePageSchema extends BasePageSchema {
  layout: "homepage";
  page: HomePageProps;
}

export interface NotFoundPageSchema extends BasePageSchema {
  layout: "notfound";
  page: NotFoundPageProps;
}

export interface SearchPageSchema extends BasePageSchema {
  layout: "search";
  page: SearchPageProps;
}

export interface FileRefSchema extends BasePageSchema {
  layout: "file";
  page: FileRefProps;
}

export interface LinkRefSchema extends BasePageSchema {
  layout: "link";
  page: LinkRefProps;
}

export type IsomerPageSchema =
  | ArticlePageSchema
  | CollectionPageSchema
  | ContentPageSchema
  | HomePageSchema
  | NotFoundPageSchema
  | SearchPageSchema
  | FileRefSchema
  | LinkRefSchema;

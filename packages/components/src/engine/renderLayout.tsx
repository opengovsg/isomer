import type { IsomerPageSchemaType } from "~/types"
import { ArticleLayout } from "~/templates/next/layouts/Article"
import { CollectionLayout } from "~/templates/next/layouts/Collection"
import { ContentLayout } from "~/templates/next/layouts/Content"
import { DatabaseLayout } from "~/templates/next/layouts/Database"
import { HomepageLayout } from "~/templates/next/layouts/Homepage"
import { IndexPageLayout } from "~/templates/next/layouts/IndexPage"
import { NotFoundLayout } from "~/templates/next/layouts/NotFound"
import { SearchLayout } from "~/templates/next/layouts/Search"
import { getThemeOverrides } from "~/themes/overrides"

export const defaultLayouts = {
  ArticleLayout,
  CollectionLayout,
  ContentLayout,
  DatabaseLayout,
  HomepageLayout,
  IndexPageLayout,
  NotFoundLayout,
  SearchLayout,
}

export const renderLayout = (props: IsomerPageSchemaType) => {
  const layouts = {
    ...defaultLayouts,
    ...getThemeOverrides(props.site.theme).layouts,
  }
  switch (props.layout) {
    case "article":
      return <layouts.ArticleLayout {...props} />
    case "collection":
      return <layouts.CollectionLayout {...props} />
    case "content":
      return <layouts.ContentLayout {...props} />
    case "database":
      return <layouts.DatabaseLayout {...props} />
    case "homepage":
      return <layouts.HomepageLayout {...props} />
    case "index":
      return <layouts.IndexPageLayout {...props} />
    case "notfound":
      return <layouts.NotFoundLayout {...props} />
    case "search":
      return <layouts.SearchLayout {...props} />
    // These are references that we should not render to the user
    case "link":
      return <></>
    default:
      const _: never = props
      return <></>
  }
}

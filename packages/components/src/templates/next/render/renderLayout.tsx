import type { IsomerPageSchemaType } from "~/types"
import { getThemeOverrides } from "~/themes/overrides"

import { ArticleLayout } from "../layouts/Article"
import { CollectionLayout } from "../layouts/Collection"
import { ContentLayout } from "../layouts/Content"
import { DatabaseLayout } from "../layouts/Database"
import { HomepageLayout } from "../layouts/Homepage"
import { IndexPageLayout } from "../layouts/IndexPage"
import { NotFoundLayout } from "../layouts/NotFound"
import { SearchLayout } from "../layouts/Search"

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

import type { IsomerPageSchemaType } from "~/types"
import {
  ArticleLayout,
  CollectionLayout,
  ContentLayout,
  DatabaseLayout,
  HomepageLayout,
  IndexPageLayout,
  NotFoundLayout,
  SearchLayout,
} from "../layouts"

export const renderLayout = ({
  LinkComponent = "a",
  ...rest
}: IsomerPageSchemaType) => {
  const props = {
    ...rest,
    LinkComponent,
  }

  switch (props.layout) {
    case "article":
      return <ArticleLayout {...props} />
    case "collection":
      return <CollectionLayout {...props} />
    case "content":
      return <ContentLayout {...props} />
    case "database":
      return <DatabaseLayout {...props} />
    case "homepage":
      return <HomepageLayout {...props} />
    case "index":
      return <IndexPageLayout {...props} />
    case "notfound":
      return <NotFoundLayout {...props} />
    case "search":
      return <SearchLayout {...props} />
    // These are references that we should not render to the user
    case "file":
    case "link":
      return <></>
    default:
      const _: never = props
      return <></>
  }
}

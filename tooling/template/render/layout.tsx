import dynamic from "next/dynamic"

import type { IsomerPageSchemaType } from "../../../packages/components/dist/esm/types"

const ArticleLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/Article").then(
    (mod) => mod.ArticleLayout,
  ),
)
const CollectionLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/Collection").then(
    (mod) => mod.CollectionLayout,
  ),
)
const ContentLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/Content").then(
    (mod) => mod.ContentLayout,
  ),
)
const DatabaseLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/Database").then(
    (mod) => mod.DatabaseLayout,
  ),
)
const HomepageLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/Homepage").then(
    (mod) => mod.HomepageLayout,
  ),
)
const IndexPageLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/IndexPage").then(
    (mod) => mod.IndexPageLayout,
  ),
)
const NotFoundLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/NotFound").then(
    (mod) => mod.NotFoundLayout,
  ),
)
const SearchLayout = dynamic(() =>
  import("@opengovsg/isomer-components/templates/next/layouts/Search").then(
    (mod) => mod.SearchLayout,
  ),
)

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

import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { ArticleLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/ArticleSkeleton"
import { ContentLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/ContentSkeleton"
import { HomepageLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/HomepageSkeleton"
import { IndexPageLayoutSkeleton } from "@opengovsg/isomer-components/templates/next/layouts/IndexPageSkeleton"
import { NotFoundLayout } from "@opengovsg/isomer-components/templates/next/layouts/NotFound"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

import { renderPageContent } from "./lightComponents"

/**
 * Light catch-all dispatcher: no Collection / Search / Database imports.
 * Heavy landings for those layouts are codegen'd under app/(heavy)/.
 */
export const renderLightLayout = (props: IsomerPageSchemaType) => {
  switch (props.layout) {
    case "article":
      return (
        <ArticleLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "content":
      return (
        <ContentLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "homepage":
      return (
        <HomepageLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "index":
      return (
        <IndexPageLayoutSkeleton
          {...props}
          renderPageContent={renderPageContent}
        />
      )
    case "notfound":
      return <NotFoundLayout {...props} />
    // Heavy layouts are owned by dedicated routes; should never hit the catch-all.
    case "collection":
    case "database":
    case "search":
    case "file":
    case "link":
      return <></>
    default: {
      const _: never = props
      return <></>
    }
  }
}

export const LightRenderEngine = (props: IsomerPageSchemaType) => {
  const renderProps: IsomerPageSchemaType = {
    ...props,
    site: {
      ...props.site,
      siteMapArray:
        props.site.siteMapArray ?? getSitemapAsArray(props.site.siteMap),
    },
  }

  return renderLightLayout(renderProps)
}

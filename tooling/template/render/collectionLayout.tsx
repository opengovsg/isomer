import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import { CollectionLayout } from "@opengovsg/isomer-components/templates/next/layouts/Collection"
import { getSitemapAsArray } from "@opengovsg/isomer-components/utils/getSitemapAsArray"

/**
 * Collection landing only — do not import Search/Database here.
 * Codegen'd `app/(heavy)/…` collection routes import this engine alone.
 */
export const CollectionRenderEngine = (props: IsomerPageSchemaType) => {
  const renderProps: IsomerPageSchemaType = {
    ...props,
    site: {
      ...props.site,
      siteMapArray:
        props.site.siteMapArray ?? getSitemapAsArray(props.site.siteMap),
    },
  }

  if (renderProps.layout !== "collection") {
    return <></>
  }

  return <CollectionLayout {...renderProps} />
}

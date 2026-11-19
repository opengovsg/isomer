import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { ReactNode } from "react"
import {
  getPageJsonLd,
  getSiteJsonLd,
  RenderApplicationHeadScripts,
  RenderApplicationScripts,
  RenderEngine,
  RenderPageHead,
} from "@opengovsg/isomer-components"
import { renderToString } from "react-dom/server"

import { serializeForInlineScript } from "@isomer/validators"

import { withIslandIds } from "../islands/react"
import { IslandServerProvider } from "../islands/server"
import {
  assetsBaseUrl,
  config,
  environment,
  footer,
  siteProps,
  sitemap,
} from "./site"

// Each top-level render counts its ids from its own prefix, so they never collide across renders.
// IslandServerProvider makes island() components render with their props for hydration.
const toHtml = (node: ReactNode, idPrefix: string) =>
  renderToString(
    withIslandIds(
      idPrefix,
      <IslandServerProvider>{node}</IslandServerProvider>,
    ),
  )

const siteJsonLd = serializeForInlineScript(
  getSiteJsonLd({ site: { ...config.site, assetsBaseUrl }, footer, sitemap }),
)

const appScripts = toHtml(
  <RenderApplicationScripts
    // @ts-expect-error same loose typing as apps/template
    site={{
      ...config.site,
      environment,
      siteMap: sitemap,
      assetsBaseUrl,
      isomerMsClarityId: process.env.NEXT_PUBLIC_ISOMER_MICROSOFT_CLARITY_ID,
    }}
    // @ts-expect-error same loose typing as apps/template
    themeColors={config.colors}
  />,
  "s",
)

const headScripts = toHtml(
  <RenderApplicationHeadScripts site={{ environment }} />,
  "h",
)

export const renderPage = (
  schema: IsomerPageSchemaType,
  { withPageJsonLd = true } = {},
) => {
  const renderSchema = { ...schema, site: siteProps } as IsomerPageSchemaType
  return {
    head: toHtml(<RenderPageHead {...renderSchema} />, "m"),
    headScripts,
    body: toHtml(<RenderEngine {...renderSchema} />, "b"),
    appScripts,
    siteJsonLd,
    pageJsonLd: withPageJsonLd
      ? serializeForInlineScript(
          getPageJsonLd({
            ...schema,
            site: { siteName: config.site.siteName, url: config.site.url },
          }),
        )
      : undefined,
  }
}

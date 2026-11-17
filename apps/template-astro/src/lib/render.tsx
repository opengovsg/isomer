import type { IsomerPageSchemaType } from "@opengovsg/isomer-components"
import type { ComponentProps, ReactNode } from "react"
import {
  getMetadata,
  getPageJsonLd,
  getSiteJsonLd,
  RenderApplicationHeadScripts,
  RenderApplicationScripts,
  RenderEngine,
} from "@opengovsg/isomer-components"
import { renderToString } from "react-dom/server"

import { serializeForInlineScript } from "@isomer/validators"

import { renderHead } from "./head"
import {
  assetsBaseUrl,
  config,
  environment,
  footer,
  siteProps,
  sitemap,
} from "./site"

// next/script stand-in for RenderApplicationScripts: plain <script>, no client loader.
const PlainScript = ({
  strategy: _strategy,
  ...props
}: ComponentProps<"script"> & { strategy?: string }) => (
  <script {...props} async={props.src ? true : undefined} />
)

// Each top-level render gets its own prefix so useId values never collide across renders.
const toHtml = (node: ReactNode, identifierPrefix: string) =>
  renderToString(<>{node}</>, { identifierPrefix })

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
    ScriptComponent={PlainScript}
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
    head: renderHead(getMetadata(renderSchema), config.site.siteName),
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

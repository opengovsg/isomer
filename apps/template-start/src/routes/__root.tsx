import type { CSSProperties } from "react"
import { IsomerProviders } from "@/src/components/IsomerProviders"
import { ScriptTag } from "@/src/components/ScriptTag"
import { getLocalThemeStyle, getSiteContext } from "@/src/lib/site"
import {
  getSiteJsonLd,
  RenderApplicationHeadScripts,
  RenderApplicationScripts,
} from "@opengovsg/isomer-components"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import { serializeForInlineScript } from "@isomer/validators"

import "@/styles/globals.css"

export const Route = createRootRoute({
  head: () => {
    const { config } = getSiteContext()
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: config.site.siteName },
      ],
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const ctx = getSiteContext()
  const jsonLd = getSiteJsonLd({
    site: {
      ...ctx.config.site,
      assetsBaseUrl: ctx.assetsBaseUrl,
    },
    footer: ctx.footer,
    sitemap: ctx.sitemap,
  })

  const localTheme = getLocalThemeStyle()

  return (
    <html
      lang="en"
      data-theme={ctx.config.site.theme || "isomer-next"}
      style={localTheme as CSSProperties | undefined}
    >
      <head>
        <RenderApplicationHeadScripts
          site={{
            ...ctx.config.site,
            environment: ctx.environment,
          }}
        />
        <HeadContent />
      </head>
      <body className="antialiased">
        <IsomerProviders>{children}</IsomerProviders>
        <RenderApplicationScripts
          site={{
            ...ctx.config.site,
            environment: ctx.environment,
            siteMap: ctx.sitemap,
            assetsBaseUrl: ctx.assetsBaseUrl,
            isomerMsClarityId: ctx.isomerMsClarityId,
          }}
          themeColors={ctx.config.colors}
          ScriptComponent={ScriptTag}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeForInlineScript(jsonLd),
          }}
        />
        <Scripts />
      </body>
    </html>
  )
}

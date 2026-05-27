import "@fontsource-variable/inter"
import "@/styles/globals.css"
import config from "@/data/config.json"
import sitemap from "@/sitemap.json"
import {
  RenderApplicationHeadScripts,
  RenderApplicationScripts,
} from "@opengovsg/isomer-components"

import { IsomerProviders } from "./providers"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: config.site.siteName || "Isomer",
  url: config.site.url || "https://www.isomer.gov.sg",
}

// Plain <script> wrapper that accepts the same props as next/script, dropping
// the `strategy` prop which has no HTML equivalent. In a static Waku build all
// scripts are inlined at render time so the loading-strategy distinction is
// not needed; the output is identical regardless of strategy.
const ScriptComponent = ({
  strategy: _strategy,
  ...props
}: React.ScriptHTMLAttributes<HTMLScriptElement> & {
  strategy?: string
}) => <script {...props} />

export const getConfig = () => ({
  render: "static" as const,
})

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" data-theme={config.site.theme || "isomer-next"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{config.site.siteName}</title>
        <RenderApplicationHeadScripts
          site={{
            ...config.site,
            environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          }}
        />
      </head>
      <body className="antialiased">
        <IsomerProviders>{children}</IsomerProviders>
        <RenderApplicationScripts
          site={{
            ...config.site,
            environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
            // @ts-expect-error to fix when types are proper
            siteMap: sitemap,
            assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
            isomerMsClarityId:
              process.env.NEXT_PUBLIC_ISOMER_MICROSOFT_CLARITY_ID,
          }}
          ScriptComponent={ScriptComponent}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  )
}

export default RootLayout

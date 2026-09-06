import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { Metadata } from "next"
import config from "@/data/config.json"
import "@/styles/globals.css"
import footer from "@/data/footer.json"
import sitemap from "@/sitemap.json"
import {
  getSiteJsonLd,
  RenderApplicationHeadScripts,
  RenderApplicationScripts,
} from "@opengovsg/isomer-components"
import { Inter } from "next/font/google"
import Script from "next/script"

import { serializeForInlineScript } from "@isomer/validators"

import { IsomerProviders } from "./providers"

const inter = Inter({
  // while we support other languages, we should only preload the latin subset
  // as it is the most common subset and the most likely to be used
  // we accept that non-latin languages will not be self hosted and preloaded
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
})

const jsonLd = getSiteJsonLd({
  footer,
  site: {
    ...config.site,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  },
  // SAFETY: publisher-generated sitemap.json is validated at site build time
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- publisher-generated sitemap JSON
  sitemap: sitemap as IsomerSitemap,
})

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: {
    default: config.site.siteName,
    template: `%s | ${config.site.siteName}`,
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    className={inter.variable}
    data-theme={config.site.theme || "isomer-next"}
    lang="en"
  >
    <head>
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
        ScriptComponent={Script}
        site={{
          ...config.site,
          assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
          environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
          isomerMsClarityId:
            process.env.NEXT_PUBLIC_ISOMER_MICROSOFT_CLARITY_ID,
          // typing(isomer): fix when types are proper
          // @ts-expect-error to fix when types are proper
          siteMap: sitemap,
        }}
      />

      <script
        type="application/ld+json"
        // oxlint-disable-next-line react/no-danger -- JSON-LD is serialized via serializeForInlineScript
        dangerouslySetInnerHTML={{
          __html: serializeForInlineScript(jsonLd),
        }}
      />
    </body>
  </html>
)

export default RootLayout

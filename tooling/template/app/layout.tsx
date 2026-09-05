import type { Metadata } from "next"
import type { CSSProperties } from "react"
import config from "@/data/config.json"
import footer from "@/data/footer.json"
import "@/styles/globals.css"
import sitemap from "@/sitemap.json"
import {
  getSiteJsonLd,
  type IsomerSitemap,
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
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jsonLd = getSiteJsonLd({
  site: {
    ...config.site,
    assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
  },
  footer,
  sitemap: sitemap as IsomerSitemap,
})

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: {
    template: "%s | " + config.site.siteName,
    default: config.site.siteName,
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const localTheme =
    process.env.NODE_ENV === "development"
      ? ({
          "--color-brand-canvas-default": config.colors.brand.canvas.default,
          "--color-brand-canvas-alt": config.colors.brand.canvas.alt,
          "--color-brand-canvas-backdrop": config.colors.brand.canvas.backdrop,
          "--color-brand-canvas-inverse": config.colors.brand.canvas.inverse,
          "--color-brand-interaction-default":
            config.colors.brand.interaction.default,
          "--color-brand-interaction-hover":
            config.colors.brand.interaction.hover,
          "--color-brand-interaction-pressed":
            config.colors.brand.interaction.pressed,
        } as CSSProperties)
      : undefined

  return (
    <html
      lang="en"
      data-theme={config.site.theme || "isomer-next"}
      className={inter.variable}
      style={localTheme}
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
          site={{
            ...config.site,
            environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
            // TODO: fixup all the typing errors
            // @ts-expect-error to fix when types are proper
            siteMap: sitemap,
            assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
            isomerMsClarityId:
              process.env.NEXT_PUBLIC_ISOMER_MICROSOFT_CLARITY_ID,
          }}
          ScriptComponent={Script}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeForInlineScript(jsonLd),
          }}
        />
      </body>
    </html>
  )
}

export default RootLayout

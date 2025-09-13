import config from "@/data/config.json"
import sitemap from "@/sitemap.json"

import "@/styles/globals.css"

import type { Metadata } from "next"
import Script from "next/script"
import { RenderLayoutComponents } from "@opengovsg/isomer-components"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: {
    template: "%s | " + config.site.siteName,
    default: config.site.siteName,
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" data-theme={config.site.theme || "isomer-next"}>
      <body className="antialiased">
        {children}
        <RenderLayoutComponents
          site={{
            ...config.site,
            environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
            // TODO: fixup all the typing errors
            // @ts-ignore to fix when types are proper
            siteMap: sitemap,
            assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
            isomerGtmId: process.env.NEXT_PUBLIC_ISOMER_GOOGLE_TAG_MANAGER_ID,
          }}
          ScriptComponent={Script}
        />
      </body>
    </html>
  )
}

export default RootLayout

import config from "@/data/config.json"
import sitemap from "@/sitemap.json"

import "@/styles/globals.css"

import type { Metadata } from "next"
import Script from "next/script"
import { RenderApplicationScripts } from "@opengovsg/isomer-components"
import { Partytown } from "@qwik.dev/partytown/react"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: {
    template: "%s | " + config.site.siteName,
    default: config.site.siteName,
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const usePartytown = process.env.NEXT_PUBLIC_USE_PARTYTOWN === "true"

  return (
    <html lang="en" data-theme={config.site.theme || "isomer-next"}>
      {usePartytown && (
        <head>
          <Partytown
            debug={
              process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT !== "production"
            }
            forward={["dataLayer.push", "fbq"]}
          />
        </head>
      )}
      <body className="antialiased">
        {children}
        <RenderApplicationScripts
          site={{
            ...config.site,
            environment: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
            // TODO: fixup all the typing errors
            // @ts-expect-error to fix when types are proper
            siteMap: sitemap,
            assetsBaseUrl: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
            isomerGtmId: process.env.NEXT_PUBLIC_ISOMER_GOOGLE_TAG_MANAGER_ID,
            isomerMsClarityId:
              process.env.NEXT_PUBLIC_ISOMER_MICROSOFT_CLARITY_ID,
            usePartytown,
          }}
          ScriptComponent={Script}
        />
      </body>
    </html>
  )
}

export default RootLayout

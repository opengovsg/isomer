import config from "@/data/config.json"

import "@/styles/globals.css"

import type { Metadata } from "next"
import {
  AskgovWidget,
  VicaStylesheet,
  VicaWidget,
} from "@opengovsg/isomer-components"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: {
    template: "%s | " + config.site.siteName,
    default: config.site.siteName,
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { site } = config

  return (
    <html lang="en" data-theme={config.site.theme || "isomer-next"}>
      <body className="antialiased">{children}</body>

      {/* Ensures that the webchat widget only loads after the page has loaded */}
      {/* Note: did not account for both being added to the config as it's a very unlikely scenario and there's "correct" way to handle this */}
      {/* @ts-ignore sample config file not typed */}
      {site.vica && (
        <>
          <VicaStylesheet
            environment={process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT}
          />
          {/* @ts-ignore sample config file not typed */}
          <VicaWidget site={site} {...site.vica} />
        </>
      )}
      {/* @ts-ignore sample config file not typed */}
      {site.askgov && (
        <AskgovWidget
          environment={process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT}
          // @ts-ignore sample config file not typed
          {...site.askgov}
        />
      )}
    </html>
  )
}

export default RootLayout

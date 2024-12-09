import config from "@/data/config.json"

import "@/styles/globals.css"

import type { Metadata } from "next"

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
      <body className="antialiased">{children}</body>
    </html>
  )
}

export default RootLayout

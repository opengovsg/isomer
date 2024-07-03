import config from "#data/config"
import "../styles/globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    template: "%s | " + config.site.siteName,
    default: config.site.siteName,
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" data-theme={config.site.theme || "isomer-next"}>
      <body>{children}</body>
    </html>
  )
}

export default RootLayout

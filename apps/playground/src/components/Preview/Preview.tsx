import { RenderEngine } from "@opengovsg/isomer-components"
import { forwardRef, type PropsWithChildren } from "react"

import footer from "../../data/footer.json"
import navBar from "../../data/navbar.json"
import placeholderSchema from "../../data/placeholder.json"

interface PreviewSchema {
  version: string
  layout: string
  page: Record<string, unknown>
  content: unknown[]
}

export type { PreviewSchema }

export interface PreviewProps {
  schema?: PreviewSchema
}

// Add a fake link component to prevent the preview from navigating away
const FakeLink = forwardRef<
  HTMLAnchorElement,
  PropsWithChildren<{ href: string }>
>(({ children, href, ...rest }, ref) => {
  if (href.startsWith("#")) {
    return (
      <a {...rest} href={href} ref={ref}>
        {children}
      </a>
    )
  }

  return (
    <a {...rest} href={href} ref={ref} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  )
})

export default function Preview({ schema }: PreviewProps) {
  const renderSchema = schema ?? placeholderSchema

  return (
    <RenderEngine
      site={{
        siteName: "Ministry of Trade and Industry",
        // @ts-expect-error preview uses a minimal sitemap stub without required fields
        siteMap: { title: "Home", permalink: "/", children: [] },
        theme: "isomer-next",
        logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
        isGovernment: true,
        environment: "production",
        lastUpdated: "3 Apr 2024",
        navbar: navBar,
        // @ts-expect-error JSON import widens socialMediaLinks.type to string
        footerItems: footer,
        assetsBaseUrl: `https://isomer-user-content.by.gov.sg`,
      }}
      // @ts-expect-error playground JSON is validated at runtime, not compile time
      layout={renderSchema.layout}
      // @ts-expect-error playground JSON is validated at runtime, not compile time
      page={{
        ...renderSchema.page,
        permalink: "/",
        lastModified: new Date().toISOString(),
      }}
      // @ts-expect-error playground JSON is validated at runtime, not compile time
      content={renderSchema.content}
      LinkComponent={FakeLink}
    />
  )
}

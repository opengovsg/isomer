import type { IsomerSchema } from "@opengovsg/isomer-components"
import { RenderEngine } from "@opengovsg/isomer-components"

import { trpc } from "~/utils/trpc"

export default function Preview(props: IsomerSchema) {
  const [{ theme, isGovernment, sitemap, name }] =
    trpc.site.getConfig.useSuspenseQuery({ id: 1 })
  const [{ content: footer }] = trpc.site.getFooter.useSuspenseQuery({
    id: 1,
  })
  const [{ content: navbar }] = trpc.site.getNavbar.useSuspenseQuery({
    id: 1,
  })

  return (
    <RenderEngine
      {...props}
      site={{
        siteName: name,
        // TODO: fixup all the typing errors
        // @ts-expect-error to fix when types are proper
        // TODO: dynamically generate sitemap
        siteMap: { title: "Home", permalink: "/", children: [] },
        theme,
        logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
        isGovernment,
        environment: "production",
        lastUpdated: "3 Apr 2024",
        navBarItems: navbar.items,
        footerItems: footer,
      }}
    />
  )
}

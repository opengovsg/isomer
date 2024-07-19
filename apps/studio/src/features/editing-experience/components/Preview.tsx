import type { IsomerSchema } from "@opengovsg/isomer-components"
import { Skeleton } from "@chakra-ui/react"
import { RenderEngine } from "@opengovsg/isomer-components"

import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

function SuspendablePreview(props: IsomerSchema) {
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
        navBarItems: navbar,
        footerItems: footer,
      }}
    />
  )
}

const Preview = withSuspense(
  SuspendablePreview,
  <Skeleton width="100%" height="100%" />,
)
export default Preview

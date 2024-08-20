import type {
  IsomerPageSchemaType,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { PartialDeep } from "type-fest"
import { Skeleton } from "@chakra-ui/react"
import { RenderEngine } from "@opengovsg/isomer-components"
import { merge } from "lodash"

import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

type PreviewProps = IsomerSchema & {
  permalink: string
  siteId: number
  overrides?: PartialDeep<IsomerPageSchemaType>
}

function SuspendablePreview({
  permalink,
  siteId,
  overrides = {},
  ...props
}: PreviewProps) {
  const [siteConfig] = trpc.site.getConfig.useSuspenseQuery({ id: siteId })
  const [{ content: footer }] = trpc.site.getFooter.useSuspenseQuery({
    id: siteId,
  })
  const [{ content: navbar }] = trpc.site.getNavbar.useSuspenseQuery({
    id: siteId,
  })

  const renderProps = merge(props, overrides, {
    page: {
      permalink,
    },
  })

  return (
    <RenderEngine
      {...renderProps}
      site={{
        // TODO: fixup all the typing errors
        // @ts-expect-error to fix when types are proper
        // TODO: dynamically generate sitemap
        siteMap: { title: "Home", permalink: "/", children: [] },
        environment: "production",
        // TODO: Fetch from DB in the future
        lastUpdated: new Date().toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        ...siteConfig,
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

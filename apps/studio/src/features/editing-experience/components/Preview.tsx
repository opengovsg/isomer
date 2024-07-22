import type {
  IsomerPageSchemaType,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { PartialDeep } from "type-fest"
import { Skeleton, Box } from "@chakra-ui/react"
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
    // TODO: should migrate this to a colour token
    <Box p="2rem" backgroundColor="#EDEDED">
      {/* TODO: should migrate this to a colour token */}
      <Box borderRadius="8px" backgroundColor="white" boxShadow="0px 0px 20px 0px #6868684D" overflow="hidden">
        <RenderEngine
          {...renderProps}
          site={{
            // TODO: fixup all the typing errors
            // @ts-expect-error to fix when types are proper
            // TODO: dynamically generate sitemap
            siteMap: { title: "Home", permalink: "/", children: [] },
            environment: "production",
            // TODO: Fetch from DB in the future
            lastUpdated: "3 Apr 2024",
            ...siteConfig,
            navBarItems: navbar,
            footerItems: footer,
          }}
        />
      </Box>
    </Box>
  )
}

const Preview = withSuspense(
  SuspendablePreview,
  <Skeleton width="100%" height="100%" />,
)
export default Preview

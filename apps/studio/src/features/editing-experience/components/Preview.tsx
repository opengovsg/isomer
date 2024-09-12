import type {
  IsomerPageSchemaType,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import type { PartialDeep } from "type-fest"
import { Skeleton } from "@chakra-ui/react"
import { RenderEngine } from "@opengovsg/isomer-components"
import { merge } from "lodash"

import { withSuspense } from "~/hocs/withSuspense"
import { useEnv } from "~/hooks/useEnv"
import { trpc } from "~/utils/trpc"

type PreviewProps = IsomerSchema & {
  permalink: string
  lastModified?: Date
  siteId: number
  overrides?: PartialDeep<IsomerPageSchemaType>
}

// Add a fake link component to prevent the preview from navigating away
const FakeLink = ({ children, ...rest }: PropsWithChildren<unknown>) => (
  <a {...rest} href="#" onClick={(e) => e.preventDefault()}>
    {children}
  </a>
)

function SuspendablePreview({
  permalink,
  lastModified = new Date(),
  siteId,
  overrides = {},
  ...props
}: PreviewProps) {
  const { env } = useEnv()
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
      lastModified,
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
        ...siteConfig,
        navBarItems: navbar,
        footerItems: footer,
        assetsBaseUrl: `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`,
      }}
      LinkComponent={FakeLink}
    />
  )
}

const Preview = withSuspense(
  SuspendablePreview,
  <Skeleton width="100%" height="100%" />,
)
export default Preview

import type {
  IsomerGeneratedSiteProps,
  IsomerPageSchemaType,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { PropsWithChildren } from "react"
import type { PartialDeep } from "type-fest"
import { forwardRef } from "react"
import Script from "next/script"
import { Skeleton } from "@chakra-ui/react"
import { RenderEngine } from "@opengovsg/isomer-components"
import { merge } from "lodash"

import { withSuspense } from "~/hocs/withSuspense"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"
import { trpc } from "~/utils/trpc"

export type PreviewProps = IsomerSchema & {
  permalink: string
  lastModified?: string
  siteId: number
  overrides?: PartialDeep<IsomerPageSchemaType>
  siteMap: IsomerGeneratedSiteProps["siteMap"]
}

// Add a fake link component to prevent the preview from navigating away
const FakeLink = forwardRef<HTMLAnchorElement, PropsWithChildren<unknown>>(
  ({ children, ...rest }, ref) => (
    <a {...rest} ref={ref} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  ),
)

function SuspendablePreview({
  permalink,
  lastModified = new Date().toISOString(),
  siteId,
  overrides = {},
  siteMap,
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
      lastModified,
    },
  })

  return (
    <RenderEngine
      {...renderProps}
      // TODO: fixup all the typing errors
      // @ts-expect-error to fix when types are proper
      site={{
        siteMap,
        environment: "production",
        ...siteConfig,
        navBarItems: navbar,
        footerItems: footer,
        assetsBaseUrl: ASSETS_BASE_URL,
      }}
      LinkComponent={FakeLink}
      ScriptComponent={Script}
      fromStudio
    />
  )
}

const PreviewWithoutSitemap = withSuspense(
  SuspendablePreview,
  <Skeleton width="100%" height="100%" />,
)
export default PreviewWithoutSitemap

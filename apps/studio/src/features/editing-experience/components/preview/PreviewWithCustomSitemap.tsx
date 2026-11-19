import type {
  IsomerGeneratedSiteProps,
  IsomerPageSchemaType,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import type { MouseEvent } from "react"
import type { PartialDeep } from "type-fest"
import { Skeleton } from "@chakra-ui/react"
import {
  HeroCarouselPreviewProvider,
  RenderEngine,
} from "@opengovsg/isomer-components"
import { merge } from "lodash-es"
import Script from "next/script"
import { useEffect } from "react"
import { withSuspense } from "~/hocs/withSuspense"
import { ASSETS_BASE_URL } from "~/utils/generateAssetUrl"
import { trpc } from "~/utils/trpc"

import { useEditPageCarouselPreview } from "./EditPageCarouselPreviewProvider"

export type PreviewProps = IsomerSchema & {
  permalink: string
  lastModified?: string
  siteId: number
  overrides?: PartialDeep<IsomerPageSchemaType>
  siteMap: IsomerGeneratedSiteProps["siteMap"]
  // Called once the page itself has rendered, i.e. after the site queries
  // resolve and the loading skeleton is replaced.
  onRendered?: () => void
}

// Keep the preview from navigating away when a link inside it is clicked. Capture phase, so it
// covers every anchor (components' links and links inside rendered prose) and still lets the
// components' own click handlers run.
const preventLinkNavigation = (event: MouseEvent) => {
  if (event.target instanceof Element && event.target.closest("a"))
    event.preventDefault()
}

const defaultLastModified = new Date().toISOString()

function SuspendablePreviewWithCustomSitemap({
  permalink,
  lastModified = defaultLastModified,
  siteId,
  overrides = {},
  siteMap,
  onRendered,
  ...props
}: PreviewProps) {
  const [baseSiteConfig] = trpc.site.getConfig.useSuspenseQuery({ id: siteId })
  const [{ content: footer }] = trpc.site.getFooter.useSuspenseQuery({
    id: siteId,
  })
  const [{ content: navbar }] = trpc.site.getNavbar.useSuspenseQuery({
    id: siteId,
  })

  const heroCarousel = useEditPageCarouselPreview()

  useEffect(() => {
    onRendered?.()
  }, [onRendered])

  const renderProps = merge(props, overrides, {
    page: {
      permalink,
      lastModified,
    },
  })

  const siteConfig = {
    ...baseSiteConfig,
    navbar,
    footerItems: footer,
    ...overrides.site,
  }

  const page = (
    <RenderEngine
      {...renderProps}
      // TODO: fixup all the typing errors
      // @ts-expect-error to fix when types are proper
      site={{
        ...siteConfig,
        siteMap,
        environment: "production",
        search: {
          type: "localSearch",
          searchUrl: "/search",
        },
        assetsBaseUrl: ASSETS_BASE_URL,
      }}
      ScriptComponent={Script}
    />
  )

  return (
    <div style={{ display: "contents" }} onClickCapture={preventLinkNavigation}>
      {heroCarousel ? (
        <HeroCarouselPreviewProvider value={heroCarousel}>
          {page}
        </HeroCarouselPreviewProvider>
      ) : (
        page
      )}
    </div>
  )
}

const PreviewWithCustomSitemap = withSuspense(
  SuspendablePreviewWithCustomSitemap,
  <Skeleton width="100%" height="100%" />,
)
export default PreviewWithCustomSitemap

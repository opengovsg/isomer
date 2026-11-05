import { Box } from "@chakra-ui/react"
import { HERO_STYLE } from "@opengovsg/isomer-components"
import { merge } from "lodash-es"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import { CarouselPreviewNotice } from "./CarouselPreviewNotice"
import { LoadingPreview } from "./LoadingPreview"
import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"
import { ViewportContainer } from "./ViewportContainer"
import { useViewport } from "./ViewportProvider"

const LoadingState = (): JSX.Element => {
  return (
    <Box bg="base.canvas.backdrop" height="100%" flexDirection="column">
      <Box
        px="2rem"
        pb="2rem"
        pt="1rem"
        overflowX="auto"
        height="100%"
        width="100%"
      >
        <LoadingPreview />
      </Box>
    </Box>
  )
}

const SuspendableEditPagePreview = (): JSX.Element => {
  const { viewport } = useViewport()
  const { previewPageState, pageId, updatedAt, siteId, permalink, title } =
    useEditorDrawerContext()

  const showCarouselNotice =
    viewport !== "fullscreen" &&
    previewPageState.content.some(
      (block) =>
        block.type === "hero" && block.variant === HERO_STYLE.carousel.key,
    )

  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })

  return (
    <ViewportContainer
      siteId={siteId}
      banner={showCarouselNotice ? <CarouselPreviewNotice /> : null}
    >
      <PreviewWithCustomSitemap
        {...merge(previewPageState, { page: { title } })}
        siteId={siteId}
        permalink={permalink}
        lastModified={updatedAt.toISOString()}
        version="0.1.0"
        siteMap={siteMap}
      />
    </ViewportContainer>
  )
}

export const EditPagePreview = withSuspense(
  SuspendableEditPagePreview,
  <LoadingState />,
)

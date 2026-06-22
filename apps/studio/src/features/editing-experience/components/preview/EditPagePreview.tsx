import { Box } from "@chakra-ui/react"
import { merge } from "lodash-es"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { withSuspense } from "~/hocs/withSuspense"
import { trpc } from "~/utils/trpc"

import { LoadingPreview } from "./LoadingPreview"
import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"
import { ViewportContainer } from "./ViewportContainer"

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
  const {
    previewPageState,
    pageId,
    updatedAt,
    siteId,
    permalink,
    title,
    showAiShimmer,
  } = useEditorDrawerContext()

  const [siteMap] = trpc.site.getLocalisedSitemap.useSuspenseQuery({
    siteId,
    resourceId: pageId,
  })

  return (
    <Box position="relative" height="100%" width="100%">
      <ViewportContainer siteId={siteId}>
        <PreviewWithCustomSitemap
          {...merge(previewPageState, { page: { title } })}
          siteId={siteId}
          permalink={permalink}
          lastModified={updatedAt.toISOString()}
          version="0.1.0"
          siteMap={siteMap}
        />
      </ViewportContainer>

      {showAiShimmer && (
        <Box
          position="absolute"
          inset={0}
          pointerEvents="none"
          zIndex={10}
          background="radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.25) 0%, rgba(253,224,71,0.12) 50%, transparent 75%)"
          sx={{
            "@keyframes aiShimmerFade": {
              "0%": { opacity: 0 },
              "15%": { opacity: 1 },
              "70%": { opacity: 1 },
              "100%": { opacity: 0 },
            },
            animation: "aiShimmerFade 1.8s ease-in-out forwards",
          }}
        />
      )}
    </Box>
  )
}

export const EditPagePreview = withSuspense(
  SuspendableEditPagePreview,
  <LoadingState />,
)

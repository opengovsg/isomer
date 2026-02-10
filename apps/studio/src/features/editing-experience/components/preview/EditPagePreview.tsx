import { useEffect, useState } from "react"
import { Box } from "@chakra-ui/react"
import merge from "lodash/merge"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { trpc } from "~/utils/trpc"
import { LoadingPreview } from "./LoadingPreview"
import PreviewWithCustomSitemap from "./PreviewWithCustomSitemap"
import { ViewportContainer } from "./ViewportContainer"

type PreviewState = "loading" | "interactive"

export const EditPagePreview = (): JSX.Element => {
  const { previewPageState, pageId, updatedAt, siteId, permalink, title } =
    useEditorDrawerContext()

  const [previewState, setPreviewState] = useState<PreviewState>("loading")
  const { data: siteMap } = trpc.site.getLocalisedSitemap.useQuery({
    siteId,
    resourceId: pageId,
  })
  const isInteractivePreviewReady = siteMap !== undefined

  useEffect(() => {
    if (!isInteractivePreviewReady) {
      return
    }

    setPreviewState((prevState) => {
      if (prevState === "loading") {
        return "interactive"
      }
      return prevState
    })
  }, [isInteractivePreviewReady])

  switch (previewState) {
    case "loading":
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
    case "interactive":
      if (!siteMap) {
        return <Box>Failed to load preview</Box>
      }

      return (
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
      )
    default:
      const _: never = previewState
      return <></>
  }
}

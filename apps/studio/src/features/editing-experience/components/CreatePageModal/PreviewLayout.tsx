import { useMemo } from "react"
import { Box, Flex, Skeleton, Stack, Text } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"
import { format } from "date-fns"

import Suspense from "~/components/Suspense"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"
import { PreviewIframe } from "../PreviewIframe"
import PreviewWithoutSitemap from "../PreviewWithoutSitemap"
import { LAYOUT_RENDER_DATA } from "./constants"
import { useCreatePageWizard } from "./CreatePageWizardContext"

export const PreviewLayout = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { currentLayout } = useCreatePageWizard()

  return (
    <Stack
      flex={1}
      overflow="hidden"
      px="2.5rem"
      pt="2rem"
      bg="base.canvas.alt"
    >
      {!isMobile && (
        <Box shadow="md" borderTopRadius="8px" height="100%">
          {currentLayout && (
            <Flex
              borderTopRadius="8px"
              width="100%"
              bg="slate.200"
              color="white"
              textStyle="caption-2"
              py="0.5rem"
              px="1rem"
              justify="center"
              whiteSpace="pre"
            >
              You're previewing the{" "}
              <Text as="span" textStyle="caption-1">
                {LAYOUT_RENDER_DATA[currentLayout].title}
              </Text>
            </Flex>
          )}
          <Box bg="white" overflow="auto" height="100%">
            <Suspense fallback={<Skeleton height="100%" />}>
              <SuspendableLayoutPreview />
            </Suspense>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

const SuspendableLayoutPreview = () => {
  const {
    layoutPreviewJson,
    currentLayout,
    siteId,
    formMethods: { watch },
  } = useCreatePageWizard()

  const themeCssVars = useSiteThemeCssVars({ siteId })

  const currentPermalink = watch("permalink", "/")

  const previewOverrides = useMemo(() => {
    switch (currentLayout) {
      case "article": {
        return {
          page: {
            date: format(new Date(), "dd MMM yyyy"),
          },
        }
      }
      case "content": {
        return {}
      }
      case "database": {
        return {}
      }
    }
  }, [currentLayout])
  return (
    <PreviewIframe
      preventPointerEvents
      keyForRerender={currentLayout}
      style={themeCssVars}
    >
      <PreviewWithoutSitemap
        overrides={previewOverrides}
        siteId={siteId}
        permalink={currentPermalink}
        siteMap={{
          id: "0",
          layout: "content",
          title: "Root",
          summary: "",
          lastModified: new Date().toISOString(),
          permalink: "",
        }}
        {...layoutPreviewJson}
      />
    </PreviewIframe>
  )
}

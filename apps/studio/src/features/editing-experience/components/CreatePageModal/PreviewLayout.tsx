/* oxlint-disable eslint/default-case, eslint/no-use-before-define, typescript/consistent-return, typescript/switch-exhaustiveness-check -- core cleanup deferred */
import { Box, Flex, Skeleton, Stack, Text } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"
import { useMemo } from "react"
import Suspense from "~/components/Suspense"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"

import { PreviewIframe } from "../preview/PreviewIframe"
import PreviewWithCustomSitemap from "../preview/PreviewWithCustomSitemap"
import { LAYOUT_RENDER_DATA } from "./constants"
import { useCreatePageWizard } from "./CreatePageWizardContext"

export const PreviewLayout = (): React.ReactNode => {
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
              You&apos;re previewing the{" "}
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
            date: "1 Jan 2026",
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
      <PreviewWithCustomSitemap
        overrides={previewOverrides}
        siteId={siteId}
        permalink={currentPermalink}
        siteMap={{
          id: "0",
          lastModified: "1970-01-01T00:00:00.000Z",
          layout: "content",
          permalink: "",
          summary: "",
          title: "Root",
        }}
        {...layoutPreviewJson}
      />
    </PreviewIframe>
  )
}

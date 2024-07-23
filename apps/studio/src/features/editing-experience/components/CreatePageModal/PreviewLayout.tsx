import { useMemo } from "react"
import { Box, Flex, Stack, Text } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"
import { format } from "date-fns"

import Preview from "../Preview"
import { LAYOUT_RENDER_DATA } from "./constants"
import { useCreatePageWizard } from "./CreatePageWizardContext"

export const PreviewLayout = (): JSX.Element => {
  const isMobile = useIsMobile()
  const {
    layoutPreviewJson,
    currentLayout,
    siteId,
    formMethods: { watch },
  } = useCreatePageWizard()

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
        return {
          page: {
            lastModified: new Date().toString(),
          },
        }
      }
    }
  }, [currentLayout])

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
          <Box
            bg="white"
            overflow="auto"
            height="100%"
            // Key used to reset the scroll to the top whenever layout changes
            key={currentLayout}
          >
            <Preview
              overrides={previewOverrides}
              siteId={siteId}
              permalink={currentPermalink}
              {...layoutPreviewJson}
            />
          </Box>
        </Box>
      )}
    </Stack>
  )
}

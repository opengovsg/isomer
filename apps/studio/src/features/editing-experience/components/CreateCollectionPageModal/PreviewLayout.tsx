import { useMemo } from "react"
import { Box, Flex, Stack } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"
import { format } from "date-fns"

import Preview from "../Preview"
import { PreviewIframe } from "../PreviewIframe"
import { useCreateCollectionPageWizard } from "./CreateCollectionPageWizardContext"

export const PreviewLayout = (): JSX.Element => {
  const isMobile = useIsMobile()
  const {
    pagePreviewJson,
    currentType,
    siteId,
    formMethods: { watch },
  } = useCreateCollectionPageWizard()

  const currentPermalink = watch("permalink", "/")

  const previewOverrides = useMemo(() => {
    switch (currentType) {
      case "pdf": {
        return {
          page: {
            date: format(new Date(), "dd MMM yyyy"),
          },
        }
      }
      case "page": {
        return {
          page: {
            lastModified: new Date().toString(),
          },
        }
      }
    }
  }, [currentType])

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
            {`You're previewing a ${currentType === "pdf" ? "PDF " : ""}collection page`}
          </Flex>
          <Box bg="white" overflow="auto" height="100%">
            <PreviewIframe preventPointerEvents keyForRerender={currentType}>
              <Preview
                overrides={previewOverrides}
                siteId={siteId}
                permalink={currentPermalink}
                {...pagePreviewJson}
              />
            </PreviewIframe>
          </Box>
        </Box>
      )}
    </Stack>
  )
}

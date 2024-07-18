import { Box, Flex, Stack } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"

import Preview from "../Preview"
import { LAYOUT_RENDER_DATA } from "./constants"
import { useCreatePageWizard } from "./CreatePageWizardContext"

export const PreviewLayout = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { layoutPreviewJson, currentLayout } = useCreatePageWizard()

  return (
    <Stack flex={1} overflow="auto" px="2.5rem" pt="2rem" bg="base.canvas.alt">
      {!isMobile && (
        <Box shadow="md" borderTopRadius="8px">
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
            >
              You're previewing the {LAYOUT_RENDER_DATA[currentLayout].title}
            </Flex>
          )}
          <Box bg="white">
            <Preview {...layoutPreviewJson} />
          </Box>
        </Box>
      )}
    </Stack>
  )
}

import { Box, Flex, Stack, Text } from "@chakra-ui/react"
import { useIsMobile } from "@opengovsg/design-system-react"

import Preview from "../Preview"
import { LAYOUT_RENDER_DATA } from "./constants"
import { useCreatePageWizard } from "./CreatePageWizardContext"

export const PreviewLayout = (): JSX.Element => {
  const isMobile = useIsMobile()
  const { layoutPreviewJson, currentLayout } = useCreatePageWizard()

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
            <Preview {...layoutPreviewJson} />
          </Box>
        </Box>
      )}
    </Stack>
  )
}

import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import {
  Box,
  Flex,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react"
import { Button, useIsMobile } from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"

import articleLayoutPreview from "~/features/editing-experience/data/articleLayoutPreview.json"
import contentLayoutPreview from "~/features/editing-experience/data/contentLayoutPreview.json"
import Preview from "../Preview"
import { LAYOUT_RENDER_DATA } from "./constants"
import { useCreatePageWizard } from "./CreatePageWizardContext"
import { LayoutOptionsInput } from "./LayoutOptionsInput"

export const CreatePageLayoutScreen = () => {
  const isMobile = useIsMobile()
  const { formMethods, onClose, handleNextToDetailScreen } =
    useCreatePageWizard()

  const { watch, control } = formMethods

  const layout = watch("layout")

  const layoutPreview: IsomerSchema | undefined = useMemo(() => {
    switch (layout) {
      case "content":
        return contentLayoutPreview as IsomerSchema
      case "article":
        return articleLayoutPreview as IsomerSchema
      default:
        return
    }
  }, [layout])

  return (
    <>
      <ModalHeader
        color="base.content.strong"
        borderBottom="1px solid"
        borderColor="base.divider.medium"
      >
        <Stack justify="space-between" flexDir={{ base: "column", md: "row" }}>
          <Text>Create a new page: Choose a layout</Text>
          <Wrap
            shouldWrapChildren
            flexDirection="row"
            justify={{ base: "flex-end", md: "flex-start" }}
            align="center"
            gap="0.75rem"
          >
            <Button variant="clear" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleNextToDetailScreen}>
              Next: Page title and URL
            </Button>
          </Wrap>
        </Stack>
      </ModalHeader>
      <ModalBody p={0} overflow="hidden" bg="base.canvas.alt">
        <Flex height="100%">
          <Stack
            borderRight="1px solid"
            borderColor="base.divider.medium"
            bg="white"
            maxWidth={{ base: "100%", md: "22.75rem" }}
            p="2rem"
            flexDir="row"
            overflow="auto"
          >
            <Controller
              control={control}
              name="layout"
              render={({ field }) => <LayoutOptionsInput {...field} />}
            />
          </Stack>
          <Stack flex={1} overflow="auto" px="2.5rem" pt="2rem">
            {layout && layoutPreview && !isMobile && (
              <Box shadow="md" borderTopRadius="8px">
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
                  You're previewing the {LAYOUT_RENDER_DATA[layout].title}
                </Flex>
                <Preview {...layoutPreview} />
              </Box>
            )}
          </Stack>
        </Flex>
      </ModalBody>
    </>
  )
}

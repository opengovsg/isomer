import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import {
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
      <ModalBody p={0} overflow="hidden">
        <Flex height="100%">
          <Stack
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
          <Stack flex={1} overflow="auto">
            {layoutPreview && !isMobile && <Preview {...layoutPreview} />}
          </Stack>
        </Flex>
      </ModalBody>
    </>
  )
}

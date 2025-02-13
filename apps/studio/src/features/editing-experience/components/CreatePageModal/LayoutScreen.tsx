import {
  Flex,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"

import { useCreatePageWizard } from "./CreatePageWizardContext"
import { LayoutOptionsInput } from "./LayoutOptionsInput"
import { PreviewLayout } from "./PreviewLayout"

export const CreatePageLayoutScreen = () => {
  const { formMethods, onClose, handleNextToDetailScreen } =
    useCreatePageWizard()

  const { control } = formMethods

  return (
    <>
      <ModalHeader
        color="base.content.strong"
        borderBottom="1px solid"
        borderColor="base.divider.medium"
        py="0.75rem"
      >
        <Stack
          align="center"
          justify="space-between"
          flexDir={{ base: "column", md: "row" }}
        >
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
        <Flex h="100%">
          <Stack
            height={0}
            minH="100%"
            borderRight="1px solid"
            borderColor="base.divider.medium"
            bg="white"
            maxWidth={{ base: "100%", md: "22.75rem" }}
            overflow="auto"
            flexDir="row"
          >
            <Flex p="2rem" h="fit-content">
              <Controller
                control={control}
                name="layout"
                render={({ field }) => <LayoutOptionsInput {...field} />}
              />
            </Flex>
          </Stack>
          <PreviewLayout />
        </Flex>
      </ModalBody>
    </>
  )
}

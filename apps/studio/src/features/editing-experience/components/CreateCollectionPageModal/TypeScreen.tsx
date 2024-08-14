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

import { AppGrid } from "~/templates/AppGrid"
import { useCreateCollectionPageWizard } from "./CreateCollectionPageWizardContext"
import { TypeOptionsInput } from "./TypeOptionsInput"

export const CreateCollectionPageTypeScreen = () => {
  const { formMethods, onClose, handleNextToDetailScreen } =
    useCreateCollectionPageWizard()

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
          <Text>Create a new collection item</Text>
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
              Next: Page details
            </Button>
          </Wrap>
        </Stack>
      </ModalHeader>
      <ModalBody p={0} overflow="hidden">
        <AppGrid h="100%" overflow="auto">
          <Flex
            gap="1rem"
            gridColumn="1 / 6"
            flexDir="column"
            align="start"
            justify="center"
            px={{ base: "1rem", md: "2rem" }}
          >
            <Text as="h3" textStyle="h3-semibold">
              What kind of collection item are you creating?
            </Text>
            <Text>Choose between a page or a PDF file.</Text>
          </Flex>
          <Stack gridColumn="6 / 13" bg="white" p="2rem" justify="center">
            <Controller
              control={control}
              name="type"
              render={({ field }) => <TypeOptionsInput {...field} />}
            />
          </Stack>
        </AppGrid>
      </ModalBody>
    </>
  )
}

import { ModalBody, ModalFooter, ModalHeader, Stack } from "@chakra-ui/react"
import { Button, Tile } from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"
import { BiLeftArrowAlt } from "react-icons/bi"

import { textStyles } from "~/theme/foundations/textStyles"
import { trpc } from "~/utils/trpc"
import {
  CreatePageFlowStates,
  useCreatePageWizard,
} from "./CreatePageWizardContext"

export const CreatePageLayoutScreen = () => {
  const { setCurrentStep, formMethods, siteId, folderId, onClose } =
    useCreatePageWizard()

  const utils = trpc.useUtils()

  const { mutate, isLoading } = trpc.page.createPage.useMutation({
    onSuccess: async () => {
      await utils.page.list.invalidate()
      onClose()
    },
    // TOOD: Error handling
  })

  const { watch, handleSubmit, control } = formMethods

  const pageTitle = watch("title")

  const handleBack = () => {
    setCurrentStep([CreatePageFlowStates.Setup, -1])
  }

  const onSubmit = handleSubmit((values) => {
    mutate({
      siteId,
      folderId,
      ...values,
    })
  })

  return (
    <>
      <ModalHeader
        color="base.content.strong"
        borderBottom="1px solid"
        borderColor="base.divider.medium"
      >
        Choose a layout for “{pageTitle}”
      </ModalHeader>
      <ModalBody p={0}>
        <Stack bg="base.canvas.alt">
          <Controller
            control={control}
            name="layout"
            render={({ field: { onChange, value, disabled, ref } }) => (
              <Tile
                isDisabled={disabled}
                variant="complex"
                flex={1}
                ref={ref}
                isSelected={value === "content"}
                onClick={() => onChange("content")}
              >
                <Tile.Title>Default layout</Tile.Title>
                <Tile.Subtitle>
                  This is the most basic layout for your content
                </Tile.Subtitle>
              </Tile>
            )}
          />
          <Controller
            control={control}
            name="layout"
            render={({ field: { onChange, value, disabled, ref } }) => (
              <Tile
                isDisabled={disabled}
                variant="complex"
                flex={1}
                ref={ref}
                isSelected={value === "article"}
                onClick={() => onChange("article")}
              >
                <Tile.Title>Article layout</Tile.Title>
                <Tile.Subtitle>
                  Designed for the perfect reading experience. Use this layout
                  for text-heavy content, such as news, press releases, and
                  speeches.
                </Tile.Subtitle>
              </Tile>
            )}
          />
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Stack
          width="100%"
          flexDirection="row"
          justify="space-between"
          align="center"
        >
          <Button
            variant="link"
            {...textStyles["subhead-2"]}
            leftIcon={<BiLeftArrowAlt fontSize="1.25rem" />}
            onClick={handleBack}
            isDisabled={isLoading}
          >
            Back to page details
          </Button>
          <Button isLoading={isLoading} onClick={onSubmit}>
            Create new page
          </Button>
        </Stack>
      </ModalFooter>
    </>
  )
}

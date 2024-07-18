import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import {
  Flex,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
} from "@chakra-ui/react"
import { Button, useIsMobile } from "@opengovsg/design-system-react"
import { Controller } from "react-hook-form"
import { BiLeftArrowAlt } from "react-icons/bi"

import articleLayoutPreview from "~/features/editing-experience/data/articleLayoutPreview.json"
import contentLayoutPreview from "~/features/editing-experience/data/contentLayoutPreview.json"
import { textStyles } from "~/theme/foundations/textStyles"
import { trpc } from "~/utils/trpc"
import Preview from "../Preview"
import {
  CreatePageFlowStates,
  useCreatePageWizard,
} from "./CreatePageWizardContext"
import { LayoutOptionsInput } from "./LayoutOptionsInput"

export const CreatePageLayoutScreen = () => {
  const isMobile = useIsMobile()
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
  const layout = watch("layout")

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
        Choose a layout for “{pageTitle}”
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

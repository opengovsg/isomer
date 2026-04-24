import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiBlock } from "react-icons/bi"
import { useZodForm } from "~/lib/form"
import { createGazetteSchema } from "~/schemas/gazette"

import { GazetteFormFields } from "../GazetteModal"

interface ModifyGazetteInitialData {
  title: string
  category: string
  subcategory: string
  notificationNumber?: string
  publishDate: Date
  publishTime: string
  fileId: string
  fileName?: string
  fileSize?: number
}

interface ModifyGazetteModalProps extends Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> {
  gazetteId: string | number
  initialData: ModifyGazetteInitialData
}

export const ModifyGazetteModal = ({
  isOpen,
  onClose,
  gazetteId,
  initialData,
}: ModifyGazetteModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModifyGazetteModalContent
        key={String(isOpen)}
        onClose={onClose}
        gazetteId={gazetteId}
        initialData={initialData}
      />
    </Modal>
  )
}

type ModifyGazetteModalContentProps = Pick<
  ModifyGazetteModalProps,
  "onClose" | "gazetteId" | "initialData"
>

const ModifyGazetteModalContent = ({
  onClose,
  gazetteId,
  initialData,
}: ModifyGazetteModalContentProps) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useZodForm({
    defaultValues: {
      title: initialData.title,
      category: initialData.category,
      subcategory: initialData.subcategory,
      notificationNumber: initialData.notificationNumber ?? "",
      publishDate: initialData.publishDate,
      publishTime: initialData.publishTime,
      fileId: initialData.fileId,
    },
    schema: createGazetteSchema,
    mode: "onChange",
  })

  const onSubmit = handleSubmit((data) => {
    // TODO: Implement API call to update gazette
    console.log("Updating gazette:", gazetteId, data)
    onClose()
  })

  const onCancelPublish = () => {
    // TODO: Implement API call to cancel gazette publication
    console.log("Cancelling gazette publication:", gazetteId)
    onClose()
  }

  const initialFile = initialData.fileName
    ? new File([], initialData.fileName, { type: "application/pdf" })
    : undefined

  return (
    <ModalContent>
      <ModalHeader px="2rem" pb="1rem" pt="2rem">
        Modify Gazette
      </ModalHeader>
      <ModalCloseButton mt="8px" size="sm" />
      <ModalBody>
        <GazetteFormFields
          register={register}
          control={control}
          errors={errors}
          initialFile={initialFile}
        />
      </ModalBody>

      <ModalFooter justifyContent="space-between">
        {isConfirmingCancel ? (
          <HStack spacing="1rem">
            <VStack alignItems="flex-start" spacing={0}>
              <Text textStyle="subhead-2" color="base.content.strong">
                Are you sure you want to cancel publish?
              </Text>
              <Text textStyle="body-2" color="base.content.medium">
                You will need to schedule the Gazette again.
              </Text>
            </VStack>
            <HStack spacing="0.75rem">
              <Button
                variant="clear"
                color="base.content.strong"
                onClick={() => setIsConfirmingCancel(false)}
              >
                No
              </Button>
              <Button colorScheme="critical" onClick={onCancelPublish}>
                Yes
              </Button>
            </HStack>
          </HStack>
        ) : (
          <Button
            variant="outline"
            colorScheme="critical"
            leftIcon={<BiBlock />}
            onClick={() => setIsConfirmingCancel(true)}
          >
            Cancel publish
          </Button>
        )}
        {!isConfirmingCancel && (
          <Button isDisabled={!isValid} type="submit" onClick={onSubmit}>
            Save changes
          </Button>
        )}
      </ModalFooter>
    </ModalContent>
  )
}

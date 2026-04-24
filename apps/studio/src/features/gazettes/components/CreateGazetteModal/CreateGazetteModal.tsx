import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
import { useZodForm } from "~/lib/form"
import { createGazetteSchema } from "~/schemas/gazette"

import { GazetteFormFields } from "../GazetteModal"

type CreateGazetteModalProps = Pick<UseDisclosureReturn, "isOpen" | "onClose">

export const CreateGazetteModal = ({
  isOpen,
  onClose,
}: CreateGazetteModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <CreateGazetteModalContent key={String(isOpen)} onClose={onClose} />
    </Modal>
  )
}

const CreateGazetteModalContent = ({
  onClose,
}: Pick<CreateGazetteModalProps, "onClose">) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useZodForm({
    defaultValues: {
      title: "",
      category: "government-gazette",
      subcategory: "advertisements",
      notificationNumber: "",
      publishDate: undefined,
      publishTime: "17:00",
      fileId: "",
    },
    schema: createGazetteSchema,
    mode: "onChange",
  })

  const onSubmit = handleSubmit((data) => {
    // TODO: Implement API call to create gazette
    console.log("Creating gazette:", data)
    onClose()
  })

  return (
    <ModalContent>
      <ModalHeader px="2rem" pb="1rem" pt="2rem">
        Add new Gazette
      </ModalHeader>
      <ModalCloseButton mt="8px" size="sm" />
      <ModalBody>
        <GazetteFormFields
          register={register}
          control={control}
          errors={errors}
        />
      </ModalBody>

      <ModalFooter>
        <Button isDisabled={!isValid} type="submit" onClick={onSubmit}>
          Add Gazette
        </Button>
      </ModalFooter>
    </ModalContent>
  )
}

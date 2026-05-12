import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import {
  Button,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { format, parse } from "date-fns"
import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { useZodForm } from "~/lib/form"
import { createGazetteSchema } from "~/schemas/gazette"
import { trpc } from "~/utils/trpc"

import { GazetteFormFields } from "../GazetteModal"

type CreateGazetteModalProps = Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> & {
  siteId: number
  collectionId: number
}

export const CreateGazetteModal = ({
  isOpen,
  onClose,
  siteId,
  collectionId,
}: CreateGazetteModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <CreateGazetteModalContent
        key={String(isOpen)}
        onClose={onClose}
        siteId={siteId}
        collectionId={collectionId}
      />
    </Modal>
  )
}

const CreateGazetteModalContent = ({
  onClose,
  siteId,
  collectionId,
}: Pick<CreateGazetteModalProps, "onClose" | "siteId" | "collectionId">) => {
  const [file, setFile] = useState<File | undefined>()
  const toast = useToast()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useZodForm({
    defaultValues: {
      title: "",
      category: "Government Gazette",
      subcategory: "",
      notificationNumber: "",
      publishDate: new Date(),
      publishTime: "16:45",
      fileId: "",
    },
    schema: createGazetteSchema,
    mode: "onChange",
  })

  const utils = trpc.useUtils()

  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadAssetMutation({
      siteId,
      resourceId: String(collectionId),
    })

  const { mutateAsync: createGazette, isPending: isCreating } =
    trpc.gazette.create.useMutation()

  const isPending = isUploading || isCreating

  const onSubmit = handleSubmit(async (data) => {
    if (!file) {
      toast({
        status: "error",
        title: "Please attach a PDF before submitting",
        ...BRIEF_TOAST_SETTINGS,
      })
      return
    }

    const scheduledAt = parse(data.publishTime, "HH:mm", data.publishDate)

    try {
      const { path: ref } = await uploadFile({ file, fileName: data.fileId })

      await createGazette({
        siteId,
        collectionId,
        title: data.title,
        permalink: uuidv4(),
        ref,
        category: data.category,
        date: format(data.publishDate, "dd/MM/yyyy"),
        description: data.notificationNumber,
        tagged: [data.subcategory],
        scheduledAt,
      })

      void utils.gazette.list.invalidate()
      toast({
        status: "success",
        title: "Gazette created successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
      onClose()
    } catch (error) {
      toast({
        status: "error",
        title: "Failed to create gazette",
        description:
          error instanceof Error ? error.message : "An error occurred",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
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
          setValue={setValue}
          onFileChange={setFile}
        />
      </ModalBody>

      <ModalFooter>
        <Button
          isDisabled={!isValid || !file}
          isLoading={isPending}
          type="submit"
          onClick={onSubmit}
        >
          Add Gazette
        </Button>
      </ModalFooter>
    </ModalContent>
  )
}

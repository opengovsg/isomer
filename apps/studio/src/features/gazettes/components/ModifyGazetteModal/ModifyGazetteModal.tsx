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
import {
  Button,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { format, parse } from "date-fns"
import { useState } from "react"
import { BiBlock } from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { useZodForm } from "~/lib/form"
import { createGazetteSchema } from "~/schemas/gazette"
import { trpc } from "~/utils/trpc"

import { GazetteFormFields } from "../GazetteModal"

interface ModifyGazetteInitialData {
  title: string
  category: string
  subcategory: string
  notificationNumber?: string
  publishDate: Date
  publishTime: string
  fileId: string
  fileKey?: string
  fileName?: string
  fileSize?: number
}

interface ModifyGazetteModalProps extends Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> {
  gazetteId: string | number
  siteId: number
  collectionId: number
  initialData: ModifyGazetteInitialData
}

export const ModifyGazetteModal = ({
  isOpen,
  onClose,
  gazetteId,
  siteId,
  collectionId,
  initialData,
}: ModifyGazetteModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModifyGazetteModalContent
        key={String(isOpen)}
        onClose={onClose}
        gazetteId={gazetteId}
        siteId={siteId}
        collectionId={collectionId}
        initialData={initialData}
      />
    </Modal>
  )
}

type ModifyGazetteModalContentProps = Pick<
  ModifyGazetteModalProps,
  "onClose" | "gazetteId" | "siteId" | "collectionId" | "initialData"
>

const ModifyGazetteModalContent = ({
  onClose,
  gazetteId,
  siteId,
  collectionId,
  initialData,
}: ModifyGazetteModalContentProps) => {
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [newFile, setNewFile] = useState<File | undefined>()
  const [hasFile, setHasFile] = useState(!!initialData.fileId)

  const toast = useToast()
  const utils = trpc.useUtils()

  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadAssetMutation({
      siteId,
      resourceId: String(collectionId),
    })
  const { mutateAsync: updateGazette, isPending: isUpdatingGazette } =
    trpc.gazette.update.useMutation()
  const { mutateAsync: deleteResource, isPending: isDeleting } =
    trpc.resource.delete.useMutation()

  const isSubmitting = isUploading || isUpdatingGazette || isDeleting

  const {
    register,
    control,
    handleSubmit,
    setValue,
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

  const onSubmit = handleSubmit(async (data) => {
    try {
      // If the user attached a fresh file, upload first and pass the new key
      // to the server. If only the filename changed, hand `desiredFileName` to
      // the server so the S3 rename + DB ref update happen as one operation.
      let newRef: string | undefined
      let desiredFileName: string | undefined

      if (newFile) {
        const { path } = await uploadFile({
          file: newFile,
          fileName: data.fileId,
        })
        newRef = path
      } else if (initialData.fileKey && initialData.fileId !== data.fileId) {
        desiredFileName = data.fileId
      }

      const scheduledAt = parse(data.publishTime, "HH:mm", data.publishDate)

      await updateGazette({
        siteId,
        gazetteId: Number(gazetteId),
        title: data.title,
        newRef,
        desiredFileName,
        category: data.category,
        date: format(data.publishDate, "dd/MM/yyyy"),
        description: data.notificationNumber,
        tagged: [data.subcategory],
        scheduledAt,
      })

      void utils.gazette.list.invalidate()
      toast({
        status: "success",
        title: "Gazette updated successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
      onClose()
    } catch (error) {
      toast({
        status: "error",
        title: "Failed to update gazette",
        description:
          error instanceof Error ? error.message : "An error occurred",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  })

  const onCancelPublish = async () => {
    try {
      // NOTE: we delete the resource here to keep in line with legacy
      // behaviour for egazette and avoid showing it to the users
      await deleteResource({
        resourceId: String(gazetteId),
        siteId,
      })
      void utils.gazette.list.invalidate()
      toast({
        status: "success",
        title: "Gazette cancelled successfully",
        ...BRIEF_TOAST_SETTINGS,
      })
      onClose()
    } catch (error) {
      toast({
        status: "error",
        title: "Failed to cancel gazette",
        description:
          error instanceof Error ? error.message : "An error occurred",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }

  const handleFileChange = (file: File | undefined) => {
    setNewFile(file)
    setHasFile(!!file)
  }

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
          setValue={setValue}
          initialFileName={initialData.fileId || undefined}
          initialFileSize={initialData.fileSize}
          onFileChange={handleFileChange}
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
          <Button
            isDisabled={!isValid || isSubmitting || !hasFile}
            isLoading={isSubmitting}
            type="submit"
            onClick={onSubmit}
          >
            Save changes
          </Button>
        )}
      </ModalFooter>
    </ModalContent>
  )
}

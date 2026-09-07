/* oxlint-disable eslint/no-use-before-define, typescript/strict-void-return -- core cleanup deferred */
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
import posthogJs from "posthog-js"
import { useState } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useUploadGazetteMutation } from "~/hooks/useUploadGazetteMutation"
import { useZodForm } from "~/lib/form"
import { createGazetteSchema } from "~/schemas/gazette"
import { trpc } from "~/utils/trpc"

import { useGazetteSubcategoriesContext } from "../../contexts/GazetteSubcategoriesContext"
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
}: CreateGazetteModalProps): React.ReactNode => (
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

const CreateGazetteModalContent = ({
  onClose,
  siteId,
  collectionId,
}: Pick<CreateGazetteModalProps, "onClose" | "siteId" | "collectionId">) => {
  const [file, setFile] = useState<File | undefined>()
  const toast = useToast()
  const { subcategoryMap } = useGazetteSubcategoriesContext()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useZodForm({
    defaultValues: {
      category: "Government Gazette",
      fileId: "",
      notificationNumber: "",
      publishDate: new Date(),
      publishTime: "16:45",
      subcategory: "",
      title: "",
    },
    mode: "onChange",
    schema: createGazetteSchema,
  })

  const utils = trpc.useUtils()

  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadGazetteMutation({
      resourceId: String(collectionId),
      siteId,
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
      const { path: ref } = await uploadFile({
        category: data.category,
        file,
        fileName: data.fileId,
        scheduledAt,
        subcategory: subcategoryMap[data.subcategory] ?? data.subcategory,
        year: data.publishDate.getFullYear(),
      })

      await createGazette({
        category: data.category,
        collectionId,
        date: format(data.publishDate, "dd/MM/yyyy"),
        description: data.notificationNumber,
        permalink: crypto.randomUUID(),
        ref,
        scheduledAt,
        siteId,
        tagged: [data.subcategory],
        title: data.title,
      })

      posthogJs.capture("gazette_created", {
        category: data.category,
        has_subcategory: !!data.subcategory,
        is_scheduled: scheduledAt > new Date(),
        site_id: siteId,
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
        description:
          error instanceof Error ? error.message : "An error occurred",
        status: "error",
        title: "Failed to create gazette",
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

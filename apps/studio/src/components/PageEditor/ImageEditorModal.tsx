import type { Editor } from "@tiptap/react"
import { useState } from "react"
import {
  Box,
  FormControl,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  RadioGroup,
  Text,
} from "@chakra-ui/react"
import {
  Attachment,
  Button,
  FormErrorMessage,
  FormLabel,
  Input,
  ModalCloseButton,
  Radio,
  useToast,
} from "@opengovsg/design-system-react"
import { BiError } from "react-icons/bi"
import { z } from "zod"

import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPES,
  MAX_IMG_FILE_SIZE_BYTES,
} from "~/features/editing-experience/components/constants"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useEnv } from "~/hooks/useEnv"
import { useGetImageFileFromUrl } from "~/hooks/useGetImageFileFromUrl"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { useZodForm } from "~/lib/form"

const MAX_IMAGE_ALT_TEXT_LENGTH = 120
const MAX_IMAGE_CAPTION_LENGTH = 100
const IMAGE_SIZE_OPTIONS = [
  {
    label: "Fill page width (recommended)",
    value: "default",
  },
  {
    label: "Small",
    value: "smaller",
  },
]

const imageSchema = z.object({
  src: z.string().optional(),
  alt: z.string().min(1).max(MAX_IMAGE_ALT_TEXT_LENGTH),
  caption: z.string().max(MAX_IMAGE_CAPTION_LENGTH).optional(),
  size: z.string().default("default"),
})
type ImageSchemaType = Partial<z.infer<typeof imageSchema>>

type ImageEditorModalContentProps = ImageSchemaType & {
  onSave: (props: ImageSchemaType) => void
}

const ImageEditorModalContent = ({
  src,
  alt,
  caption,
  size,
  onSave,
}: ImageEditorModalContentProps) => {
  const {
    env: { NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME },
  } = useEnv()
  const { siteId } = useQueryParse(editPageSchema)
  const toast = useToast()
  const [isPendingUpload, setIsPendingUpload] = useState(false)
  const [pendingAsset, setPendingAsset] = useState<File | undefined>()

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors, isValid },
  } = useZodForm({
    schema: imageSchema,
    defaultValues: {
      src,
      alt,
      caption,
      size,
    },
    reValidateMode: "onBlur",
  })
  const { data: imageFile } = useGetImageFileFromUrl(
    watch("src"),
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME,
  )

  const {
    mutate: uploadAsset,
    isLoading: isUploadingAsset,
    isError: isUploadAssetError,
  } = useUploadAssetMutation({ siteId })

  const onSubmit = handleSubmit((props) => {
    if (!pendingAsset) {
      onSave(props)
      return
    }

    uploadAsset(
      { file: pendingAsset },
      {
        onSuccess: ({ path }) => {
          onSave({ ...props, src: path })
        },
        onError: () => {
          toast({
            title: "Failed to upload image",
            description:
              "There was an error uploading the image. Please try again.",
            status: "error",
          })
        },
      },
    )
  })

  const isEditingImage = !!src && !!alt && !!size

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader>
          {isEditingImage ? "Edit image" : "Upload image"}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody display="flex" flexDir="column" gap="1.25rem">
          <FormControl isRequired isInvalid={!!errors.src}>
            <FormLabel id="image">Image</FormLabel>

            <Attachment
              {...register("src")}
              isRequired
              multiple={false}
              value={isPendingUpload ? pendingAsset : imageFile}
              onChange={(file) => {
                setIsPendingUpload(true)
                setPendingAsset(file)
              }}
              maxSize={MAX_IMG_FILE_SIZE_BYTES}
              accept={IMAGE_UPLOAD_ACCEPTED_MIME_TYPES}
            />

            <Text
              textStyle="body-2"
              textColor="base.content.medium"
              pt="0.5rem"
            >
              {`Maximum file size: ${MAX_IMG_FILE_SIZE_BYTES / 1000000} MB`}
            </Text>

            {errors.src?.message && (
              <FormErrorMessage>{errors.src.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.alt}>
            <FormLabel
              htmlFor="alt"
              description="Add a descriptive alternative text for this image. This helps visually impaired users to understand your image."
            >
              Alternate text
            </FormLabel>

            <Input
              {...register("alt")}
              id="alt"
              placeholder="Enter alternate text"
              maxLength={MAX_IMAGE_ALT_TEXT_LENGTH}
            />

            {errors.alt?.message && (
              <FormErrorMessage>{errors.alt.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isInvalid={!!errors.caption}>
            <FormLabel htmlFor="caption">Image caption</FormLabel>

            <Input
              {...register("caption")}
              id="caption"
              placeholder="Enter image caption"
              maxLength={MAX_IMAGE_CAPTION_LENGTH}
            />

            {errors.caption?.message && (
              <FormErrorMessage>{errors.caption.message}</FormErrorMessage>
            )}
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="size">Image size</FormLabel>

            <RadioGroup
              {...register("size")}
              value={watch("size")}
              onChange={(value) => setValue("size", value)}
            >
              {IMAGE_SIZE_OPTIONS.map(({ label, value }) => (
                <Radio my="1px" key={value} value={value} allowDeselect={false}>
                  {label}
                </Radio>
              ))}
            </RadioGroup>
          </FormControl>

          {isUploadAssetError && (
            <Box
              p="0.75rem"
              borderRadius="0.25rem"
              bgColor="utility.feedback.critical-subtle"
              color="utility.feedback.critical"
              display="flex"
              flexDir="row"
              gap="0.5rem"
              alignItems="center"
            >
              <Icon as={BiError} fontSize="1.25rem" />
              <Text textStyle="body-2">
                There was an error uploading the image. Please try again later.
              </Text>
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="solid"
            onClick={onSubmit}
            isDisabled={!isValid}
            isLoading={isUploadingAsset}
            type="submit"
          >
            {isEditingImage ? "Save changes" : "Upload image"}
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}

interface ImageEditorModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

export const ImageEditorModal = ({
  editor,
  isOpen,
  onClose,
}: ImageEditorModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />

    {isOpen && (
      <ImageEditorModalContent
        src={editor.getAttributes("image").src}
        alt={editor.getAttributes("image").alt}
        caption={editor.getAttributes("image").caption}
        size={editor.getAttributes("image").size}
        onSave={({ src, alt, caption, size }) => {
          if (!src || !alt) {
            editor.chain().focus().deleteNode("image")
          } else {
            editor
              .chain()
              .focus()
              .setImage({
                src,
                alt,
                caption,
                size,
              })
              .run()
          }

          onClose()
        }}
      />
    )}
  </Modal>
)

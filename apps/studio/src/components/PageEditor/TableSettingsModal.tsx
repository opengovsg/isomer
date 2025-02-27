import type { Editor } from "@tiptap/react"
import { useEffect } from "react"
import {
  FormControl,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  ModalCloseButton,
  Textarea,
} from "@opengovsg/design-system-react"
import { z } from "zod"

import { useZodForm } from "~/lib/form"

const MAX_CAPTION_LENGTH = 200
const tableSettingsSchema = z.object({
  caption: z
    .string({
      required_error: "Enter a caption for this table",
    })
    .min(1, { message: "Enter a caption for this table" })
    .max(MAX_CAPTION_LENGTH, {
      message: `Table caption should be shorter than ${MAX_CAPTION_LENGTH} characters.`,
    }),
})

interface TableSettingsModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

export const TableSettingsModal = ({
  editor,
  isOpen,
  onClose,
}: TableSettingsModalProps): JSX.Element => {
  const {
    register,
    watch,
    formState: { errors, isValid },
    setValue,
    handleSubmit,
  } = useZodForm({
    schema: tableSettingsSchema,
    defaultValues: {
      caption: "",
    },
  })

  const caption = watch("caption")

  useEffect(() => {
    // set default values here instead
    const { caption } = editor.getAttributes("table")
    setValue("caption", String(caption || ""))
    // only done once per every time the modal is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />

      <ModalContent>
        <ModalHeader mr="3.5rem">Table settings</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <FormControl isRequired isInvalid={!!errors.caption}>
            <FormLabel color="base.content.strong">
              Table caption
              <FormHelperText color="base.content.default">
                Caption should describe the contents of your table
              </FormHelperText>
            </FormLabel>

            <Textarea
              placeholder="This is the caption for your table"
              {...register("caption")}
            />

            {errors.caption?.message ? (
              <FormErrorMessage>{errors.caption.message}</FormErrorMessage>
            ) : (
              <FormHelperText mt="0.5rem" color="base.content.medium">
                {MAX_CAPTION_LENGTH - caption.length} characters left
              </FormHelperText>
            )}
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              Go back to editing
            </Button>
            <Button
              variant="solid"
              type="submit"
              isDisabled={!isValid}
              onClick={handleSubmit(({ caption }) => {
                onClose()
                editor
                  .chain()
                  .focus()
                  .updateAttributes("table", { caption })
                  .run()
              })}
            >
              Save changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

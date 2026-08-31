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
import { MAX_CAPTION_LENGTH } from "~/features/editing-experience/components/TableCaption/utils"
import { useZodForm } from "~/lib/form"

const tableSettingsSchema = z.object({
  caption: z
    .string({
      error: "Enter a caption for this table",
    })
    .trim()
    .min(1, { message: "Enter a caption for this table" })
    .max(MAX_CAPTION_LENGTH, {
      message: `Table caption should be shorter than ${MAX_CAPTION_LENGTH} characters.`,
    }),
})

interface TableSettingsModalProps {
  /** The table's current caption, used to seed the form. */
  caption: string
  isOpen: boolean
  onClose: () => void
  onSave: (caption: string) => void
}

export const TableSettingsModal = ({
  caption: currentCaption,
  isOpen,
  onClose,
  onSave,
}: TableSettingsModalProps): JSX.Element => {
  const {
    register,
    watch,
    formState: { errors, isValid },
    handleSubmit,
  } = useZodForm({
    schema: tableSettingsSchema,
    // Keep isValid in sync while typing so Save enables after clear → type.
    mode: "onChange",
    defaultValues: {
      caption: currentCaption,
    },
  })

  const caption = watch("caption")

  // Chakra's FocusLock (trapFocus) fights TipTap's BubbleMenu when the editor
  // blurs into this modal, hanging Tab — so the built-in trap stays off.
  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false}>
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
                onSave(caption)
                onClose()
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

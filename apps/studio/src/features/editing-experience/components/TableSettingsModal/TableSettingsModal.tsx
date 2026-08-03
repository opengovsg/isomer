import type { KeyboardEvent } from "react"
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
import { useRef } from "react"
import { z } from "zod"
import {
  CAPTION_MAX_LENGTH,
  normalizeTableCaptionForEdit,
} from "~/features/editing-experience/components/TableCaption/utils"
import { useZodForm } from "~/lib/form"

const tableSettingsSchema = z.object({
  caption: z
    .string({
      error: "Enter a caption for this table",
    })
    .trim()
    .min(1, { message: "Enter a caption for this table" })
    .max(CAPTION_MAX_LENGTH, {
      message: `Table caption should be shorter than ${CAPTION_MAX_LENGTH} characters.`,
    }),
})

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

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
    defaultValues: {
      caption: normalizeTableCaptionForEdit(currentCaption),
    },
  })

  const caption = watch("caption")
  const contentRef = useRef<HTMLDivElement>(null)

  // Chakra's FocusLock (trapFocus) fights TipTap's BubbleMenu (tabIndex=0 +
  // blur/focus handlers) when the editor blurs into this modal, hanging the
  // tab — so the built-in trap is disabled and this handler manually cycles
  // Tab/Shift+Tab within the modal content instead.
  const trapTabWithinContent = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || !contentRef.current) return

    const focusable =
      contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={false}>
      <ModalOverlay />

      <ModalContent ref={contentRef} onKeyDown={trapTabWithinContent}>
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
                {CAPTION_MAX_LENGTH - caption.length} characters left
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
              type="button"
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

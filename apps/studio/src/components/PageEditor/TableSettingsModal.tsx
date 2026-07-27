import type { Editor } from "@tiptap/react"
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
import { useEffect } from "react"
import { z } from "zod"
import {
  CAPTION_MAX_LENGTH,
  setTableCaptionAtPos,
} from "~/features/editing-experience/components/TableCaption/utils"
import { useZodForm } from "~/lib/form"

const tableSettingsSchema = z.object({
  caption: z
    .string({
      error: "Enter a caption for this table",
    })
    .min(1, { message: "Enter a caption for this table" })
    .max(CAPTION_MAX_LENGTH, {
      message: `Table caption should be shorter than ${CAPTION_MAX_LENGTH} characters.`,
    }),
})

interface TableSettingsModalProps {
  editor: Editor
  /** ProseMirror document position of the `table` node being edited. */
  tablePos: number
  isOpen: boolean
  onClose: () => void
}

export const TableSettingsModal = ({
  editor,
  tablePos,
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
    if (!isOpen) return

    const node = editor.state.doc.nodeAt(tablePos)
    const currentCaption =
      node?.type.name === "table"
        ? ((node.attrs.caption as string | undefined) ?? "")
        : ""
    setValue("caption", currentCaption)
    // only done once per every time the modal is opened
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tablePos])

  return (
    // trapFocus=false: with TableBubbleMenu mounted, Chakra's FocusLock and
    // TipTap's BubbleMenu (tabIndex=0 + blur/focus handlers) fight when the
    // editor blurs into this modal — hanging the tab. Keep autoFocus so the
    // textarea still receives focus; just don't run the focus trap.
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
              type="submit"
              isDisabled={!isValid}
              onClick={handleSubmit(({ caption }) => {
                setTableCaptionAtPos(editor, tablePos, caption)
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

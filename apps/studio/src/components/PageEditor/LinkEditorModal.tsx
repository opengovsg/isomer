import type { Editor } from "@tiptap/react"
import {
  Box,
  FormControl,
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
  FormLabel,
  Input,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { isEmpty } from "lodash"
import { z } from "zod"

import { LinkHrefEditor } from "~/features/editing-experience/components/LinkEditor"
import { useZodForm } from "~/lib/form"

interface LinkEditorModalContentProps {
  linkText?: string
  linkHref?: string
  onSave: (linkText: string, linkHref: string) => void
}

const LinkEditorModalContent = ({
  linkText,
  linkHref,
  onSave,
}: LinkEditorModalContentProps) => {
  const {
    handleSubmit,
    setValue,
    watch,
    register,
    setError,
    clearErrors,
    formState: { errors },
  } = useZodForm({
    mode: "onChange",
    schema: z.object({
      linkText: z.string().min(1),
      linkHref: z.string().min(1),
    }),
    defaultValues: {
      linkText,
      linkHref,
    },
    reValidateMode: "onBlur",
  })

  const isEditingLink = !!linkText && !!linkHref

  const onSubmit = handleSubmit(({ linkText, linkHref }) =>
    onSave(linkText, linkHref),
  )

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader mr="3.5rem">
          {isEditingLink ? "Edit link" : "Add link"}
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <FormControl isRequired isInvalid={!!errors.linkText}>
            <FormLabel
              id="linkText"
              description="A descriptive text. Avoid generic text like “Here”, “Click here”, or “Learn more”"
            >
              Link text
            </FormLabel>

            <Input
              type="text"
              placeholder="Browse grants"
              {...register("linkText")}
            />

            {errors.linkText?.message && (
              <FormErrorMessage>{errors.linkText.message}</FormErrorMessage>
            )}
          </FormControl>

          <Box mt="1.5rem">
            <LinkHrefEditor
              value={watch("linkHref")}
              onChange={({ value, shouldValidate }) =>
                setValue("linkHref", value, { shouldValidate })
              }
              label="Link destination"
              description="When this is clicked, open:"
              isRequired
              isInvalid={!!errors.linkHref}
              errorMessage={errors.linkHref?.message}
              setErrorMessage={(errorMessage) =>
                setError("linkHref", {
                  type: "custom",
                  message: errorMessage,
                })
              }
              clearErrorMessage={() => clearErrors("linkHref")}
            />

            {errors.linkHref?.message && (
              <FormErrorMessage>{errors.linkHref.message}</FormErrorMessage>
            )}
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="solid"
            onClick={onSubmit}
            // NOTE: Using `isEmpty` here because we trigger `setError`
            // using `isValid` doesn't trigger the error
            isDisabled={!isEmpty(errors)}
            type="submit"
          >
            {isEditingLink ? "Save link" : "Add link"}
          </Button>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}

interface LinkEditorModalProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
}

const getLinkText = (editor: Editor): string => {
  if (editor.isActive("link")) {
    return (
      editor.state.doc.nodeAt(Math.max(1, editor.view.state.selection.from - 1))
        ?.textContent ?? ""
    )
  }

  const { from, to } = editor.state.selection
  const selectedText: string = editor.state.doc.textBetween(from, to, " ")
  return selectedText
}

const getLinkHref = (editor: Editor): string => {
  if (editor.isActive("link")) {
    return String(editor.getAttributes("link").href ?? "")
  }

  return ""
}

export const LinkEditorModal = ({
  editor,
  isOpen,
  onClose,
}: LinkEditorModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />

    {isOpen && (
      <LinkEditorModalContent
        linkText={getLinkText(editor)}
        linkHref={getLinkHref(editor)}
        onSave={(linkText, linkHref) => {
          editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .unsetLink()
            .deleteSelection()
            .insertContent(`<a href="${linkHref}">${linkText}</a>`)
            .run()

          onClose()
        }}
      />
    )}
  </Modal>
)

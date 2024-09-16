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
import { z } from "zod"

import { LinkHrefEditor } from "~/features/editing-experience/components/LinkEditor"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { getReferenceLink, getResourceIdFromReferenceLink } from "~/utils/link"
import { ResourceSelector } from "../ResourceSelector"

interface PageLinkElementProps {
  value: string
  onChange: (value: string) => void
}

const PageLinkElement = ({ value, onChange }: PageLinkElementProps) => {
  const { siteId } = useQueryParse(editPageSchema)

  const selectedResourceId = getResourceIdFromReferenceLink(value)

  return (
    <ResourceSelector
      siteId={String(siteId)}
      onChange={(resourceId) =>
        onChange(getReferenceLink({ siteId: String(siteId), resourceId }))
      }
      selectedResourceId={selectedResourceId}
    />
  )
}

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
    formState: { errors, isValid },
  } = useZodForm({
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
        <ModalHeader>{isEditingLink ? "Edit link" : "Add link"}</ModalHeader>
        <ModalCloseButton />

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
              onChange={(value) => setValue("linkHref", value)}
              label="Link destination"
              description="When this is clicked, open:"
              isRequired
              isInvalid={!!errors.linkHref}
              pageLinkElement={
                <PageLinkElement
                  value={watch("linkHref")}
                  onChange={(value) => setValue("linkHref", value)}
                />
              }
              fileLinkElement={
                <Input
                  type="text"
                  value={watch("linkHref")}
                  onChange={(e) => setValue("linkHref", e.target.value)}
                  placeholder="File link"
                />
              }
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
            isDisabled={!isValid}
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

export const LinkEditorModal = ({
  editor,
  isOpen,
  onClose,
}: LinkEditorModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />

    {isOpen && (
      <LinkEditorModalContent
        linkText={
          editor.isActive("link")
            ? editor.state.doc.nodeAt(
                Math.max(1, editor.view.state.selection.from - 1),
              )?.textContent
            : ""
        }
        linkHref={
          editor.isActive("link") ? editor.getAttributes("link").href : ""
        }
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

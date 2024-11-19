import type { IconType } from "react-icons"
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

import type { LinkTypes } from "~/features/editing-experience/components/LinkEditor/constants"
import { LinkHrefEditor } from "~/features/editing-experience/components/LinkEditor"
import {
  LinkEditorContextProvider,
  useLinkEditor,
} from "~/features/editing-experience/components/LinkEditor/LinkEditorContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { getReferenceLink, getResourceIdFromReferenceLink } from "~/utils/link"
import { ResourceSelector } from "../ResourceSelector"
import { FileAttachment } from "./FileAttachment"

const editSiteSchema = z.object({
  siteId: z.coerce.number(),
})

const linkSchema = z.object({
  linkId: z.coerce.string().optional(),
})

interface PageLinkElementProps {
  value: string
  onChange: (value: string) => void
}

const PageLinkElement = ({ value, onChange }: PageLinkElementProps) => {
  const { siteId } = useQueryParse(editSiteSchema)

  const selectedResourceId = getResourceIdFromReferenceLink(value)

  return (
    <ResourceSelector
      onChange={(resourceId) =>
        onChange(getReferenceLink({ siteId: String(siteId), resourceId }))
      }
      selectedResourceId={selectedResourceId}
    />
  )
}

type LinkEditorModalContentProps = Pick<
  LinkEditorModalProps,
  "linkText" | "linkHref" | "linkTypes" | "onSave"
>

const LinkEditorModalContent = ({
  linkText,
  linkHref,
  onSave,
  linkTypes,
}: LinkEditorModalContentProps) => {
  const {
    handleSubmit,
    setValue,
    register,
    formState: { errors },
  } = useZodForm({
    mode: "onChange",
    schema: z.object({
      linkText: z.string().min(1),
      // TODO: Refactor to be required
      // Context: quick hack to ensure error message don't shown for empty linkHref for FileAttachment
      linkHref: z.string().min(1).optional(),
    }),
    defaultValues: {
      linkText,
      linkHref,
    },
    reValidateMode: "onChange",
  })

  const isEditingLink = !!linkText && !!linkHref

  const onSubmit = handleSubmit(
    // TODO: Refactor to not have to check for !!linkHref
    // Context: quick hack to ensure error message don't shown for empty linkHref for FileAttachment
    ({ linkText, linkHref }) => !!linkHref && onSave(linkText, linkHref),
  )

  // TODO: This needs to be refactored urgently
  // This is a hacky way of seeing what to render
  // and ties the link editor to the url path.
  // we should instead just pass the component directly rather than using slots

  const { linkId } = useQueryParse(linkSchema)

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader mr="3.5rem">
          {isEditingLink ? "Edit link" : "Add link"}
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          {!linkId && (
            <FormControl
              mb="1.5rem"
              isRequired={!linkId}
              isInvalid={!!errors.linkText}
            >
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
          )}

          <Box>
            <LinkEditorContextProvider
              linkTypes={linkTypes}
              linkHref={linkHref ?? ""}
              onChange={(href) => setValue("linkHref", href)}
              error={errors.linkHref?.message}
            >
              <ModalLinkEditor
                onChange={(value) => setValue("linkHref", value)}
              />

              {errors.linkHref?.message && (
                <FormErrorMessage>{errors.linkHref.message}</FormErrorMessage>
              )}
            </LinkEditorContextProvider>
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
  linkText?: string
  linkHref?: string
  onSave: (linkText: string, linkHref: string) => void
  isOpen: boolean
  onClose: () => void
  linkTypes: Record<
    string,
    {
      icon: IconType
      label: Capitalize<LinkTypes>
    }
  >
}
export const LinkEditorModal = ({
  isOpen,
  onClose,
  linkText,
  linkHref,
  onSave,
  linkTypes,
}: LinkEditorModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <ModalOverlay />

    {isOpen && (
      <LinkEditorModalContent
        linkTypes={linkTypes}
        linkText={linkText}
        linkHref={linkHref}
        onSave={(linkText, linkHref) => {
          onSave(linkText, linkHref)
          onClose()
        }}
      />
    )}
  </Modal>
)

const ModalLinkEditor = ({
  onChange,
}: {
  onChange: (value: string) => void
}) => {
  const { error, curHref, setHref } = useLinkEditor()
  const { siteId } = useQueryParse(editSiteSchema)
  const handleChange = (value: string) => {
    onChange(value)
    setHref(value)
  }

  return (
    <LinkHrefEditor
      label="Link destination"
      description="When this is clicked, open:"
      isRequired
      isInvalid={!!error}
      pageLinkElement={
        <PageLinkElement value={curHref} onChange={handleChange} />
      }
      fileLinkElement={
        <FileAttachment
          siteId={siteId}
          setHref={(href) => handleChange(href ?? "")}
        />
      }
    />
  )
}

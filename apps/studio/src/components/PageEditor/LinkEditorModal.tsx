import { useParams } from "next/navigation"
import {
  Box,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
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

import type { LinkTypeMapping } from "~/features/editing-experience/components/LinkEditor/constants"
import { LinkHrefEditor } from "~/features/editing-experience/components/LinkEditor"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { getReferenceLink, getResourceIdFromReferenceLink } from "~/utils/link"
import { trpc } from "~/utils/trpc"
import { ResourceSelector } from "../ResourceSelector"
import { FileAttachment } from "./FileAttachment"

const editSiteSchema = z.object({
  siteId: z.coerce.number(),
})

interface PageLinkElementProps {
  value: string
  onChange: (value: string) => void
}

const PageLinkElement = ({ value, onChange }: PageLinkElementProps) => {
  const { siteId } = useQueryParse(editSiteSchema)

  const selectedResourceId = getResourceIdFromReferenceLink(value)

  const { data: resource } = trpc.resource.getWithFullPermalink.useQuery({
    resourceId: selectedResourceId,
  })

  return (
    <>
      <ResourceSelector
        siteId={String(siteId)}
        onChange={(resourceId) =>
          onChange(getReferenceLink({ siteId: String(siteId), resourceId }))
        }
        selectedResourceId={selectedResourceId}
      />

      {!!resource && (
        <Box bg="utility.feedback.info-subtle" p="0.75rem" w="full" mt="0.5rem">
          <Text textStyle="caption-1">
            You selected /{resource.fullPermalink}
          </Text>
        </Box>
      )}
    </>
  )
}

interface LinkEditorModalContentProps {
  linkText?: string
  linkHref?: string
  onSave: (linkText: string, linkHref: string) => void
  linkTypes: LinkTypeMapping
}

const LinkEditorModalContent = ({
  linkText,
  linkHref,
  onSave,
  linkTypes,
}: LinkEditorModalContentProps) => {
  const {
    handleSubmit,
    setValue,
    watch,
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
    reValidateMode: "onBlur",
  })

  const isEditingLink = !!linkText && !!linkHref

  const onSubmit = handleSubmit(
    // TODO: Refactor to not have to check for !!linkHref
    // Context: quick hack to ensure error message don't shown for empty linkHref for FileAttachment
    ({ linkText, linkHref }) => !!linkHref && onSave(linkText, linkHref),
  )

  const { siteId } = useQueryParse(editSiteSchema)
  // TODO: This needs to be refactored urgently
  // This is a hacky way of seeing what to render
  // and ties the link editor to the url path.
  // we should instead just pass the component directly rather than using slots

  const { linkId } = useParams()

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
            <LinkHrefEditor
              linkTypes={linkTypes}
              value={watch("linkHref") ?? ""}
              onChange={(value) => setValue("linkHref", value)}
              label="Link destination"
              description="When this is clicked, open:"
              isRequired
              isInvalid={!!errors.linkHref}
              pageLinkElement={
                <PageLinkElement
                  value={watch("linkHref") ?? ""}
                  onChange={(value) => setValue("linkHref", value)}
                />
              }
              fileLinkElement={
                <FileAttachment
                  siteId={siteId}
                  setHref={(linkHref) => {
                    setValue("linkHref", linkHref)
                  }}
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
  linkTypes: LinkTypeMapping
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

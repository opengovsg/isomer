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

import type { LinkTypes } from "~/features/editing-experience/components/LinkEditor/constants"
import {
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_FILE_SIZE_BYTES,
} from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { LinkHrefEditor } from "~/features/editing-experience/components/LinkEditor"
import {
  LinkEditorContextProvider,
  useLinkEditor,
} from "~/features/editing-experience/components/LinkEditor/LinkEditorContext"
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

type LinkEditorModalContentProps = Pick<
  LinkEditorModalProps,
  "linkText" | "linkHref" | "showLinkText" | "linkTypes" | "onSave"
>

const LinkEditorModalContent = ({
  linkText,
  linkHref,
  showLinkText = true,
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

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader mr="3.5rem">
          {isEditingLink ? "Edit link" : "Add link"}
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          {showLinkText && (
            <FormControl mb="1.5rem" isRequired isInvalid={!!errors.linkText}>
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

export interface LinkEditorModalProps {
  linkText?: string
  linkHref?: string
  showLinkText?: boolean
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
  showLinkText,
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
        showLinkText={showLinkText}
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
          maxSizeInBytes={MAX_FILE_SIZE_BYTES}
          acceptedFileTypes={FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING}
          siteId={siteId}
          setHref={(href) => handleChange(href ?? "")}
        />
      }
    />
  )
}

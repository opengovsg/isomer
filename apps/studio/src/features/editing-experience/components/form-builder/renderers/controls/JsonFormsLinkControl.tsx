import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useRouter } from "next/router"
import {
  Box,
  FormControl,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Button,
  FormLabel,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { BiFile } from "react-icons/bi"
import { z } from "zod"

import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { ResourceSelector } from "~/components/ResourceSelector"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useZodForm } from "~/lib/form"
import { getReferenceLink, getResourceIdFromReferenceLink } from "~/utils/link"
import { trpc } from "~/utils/trpc"
import { LinkHrefEditor } from "../../../LinkEditor"
import { LINK_TYPES } from "../../../LinkEditor/constants"

export const jsonFormsLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "link"),
  ),
)

interface PageLinkModalContentProps {
  data: string
  siteId: string
  description?: string
  onClose: () => void
  onSave: (destination: string) => void
}

const PageLinkModalContent = ({
  data,
  description,
  onClose,
  onSave,
}: PageLinkModalContentProps) => {
  const { handleSubmit, setValue, watch } = useZodForm({
    schema: z.object({
      destination: z.string(),
    }),
    defaultValues: {
      destination: getResourceIdFromReferenceLink(data),
    },
  })

  const onSubmit = handleSubmit(({ destination }) => onSave(destination))
  const destination = watch("destination")

  return (
    <ModalContent>
      <form onSubmit={onSubmit}>
        <ModalHeader pr="4.5rem">Edit link</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <FormControl isRequired>
            <FormLabel id="destination">
              {description || "When this link is clicked, open..."}
            </FormLabel>
            <ResourceSelector
              queryFn={trpc.resource.getChildrenOf.useInfiniteQuery}
              onChange={(resourceId) => setValue("destination", resourceId)}
              selectedResourceId={destination}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="0.75rem">
            <Button
              variant="clear"
              onClick={onClose}
              color="base.content.default"
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              onClick={onSubmit}
              isDisabled={destination === ""}
              type="submit"
            >
              Save changes
            </Button>
          </HStack>
        </ModalFooter>
      </form>
    </ModalContent>
  )
}

interface PageLinkModalProps extends PageLinkModalContentProps {
  isOpen: boolean
}

const PageLinkModal = ({
  data,
  siteId,
  description,
  isOpen,
  onClose,
  onSave,
}: PageLinkModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />

      {isOpen && (
        <PageLinkModalContent
          data={data}
          siteId={siteId}
          description={description}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </Modal>
  )
}

interface PageLinkElementProps {
  data: string
  description?: string
  onChange: (value: string) => void
}

const PageLinkElement = ({
  data,
  description,
  onChange,
}: PageLinkElementProps) => {
  const router = useRouter()
  const siteId = String(router.query.siteId)
  const {
    isOpen: isPageLinkModalOpen,
    onOpen: onPageLinkModalOpen,
    onClose: onPageLinkModalClose,
  } = useDisclosure()
  const potentialInternalLinkResourceId = getResourceIdFromReferenceLink(data)
  const { data: potentialInternalLinkResource } =
    trpc.resource.getWithFullPermalink.useQuery(
      {
        resourceId: potentialInternalLinkResourceId,
      },
      {
        enabled: !!potentialInternalLinkResourceId,
      },
    )

  return (
    <>
      <PageLinkModal
        data={data}
        siteId={siteId}
        description={description}
        isOpen={isPageLinkModalOpen}
        onClose={onPageLinkModalClose}
        onSave={(value) => {
          const referenceId = getReferenceLink({
            siteId,
            resourceId: value,
          })
          onChange(referenceId)
          onPageLinkModalClose()
        }}
      />

      {!!potentialInternalLinkResourceId ? (
        <HStack mt="1rem">
          <VStack w="full" align="start">
            <HStack>
              <Icon as={BiFile} />
              <Text
                textStyle="subhead-2"
                noOfLines={1}
                color="base.content.default"
              >
                {potentialInternalLinkResource?.title || "Page title"}
              </Text>
            </HStack>
            <Text
              textStyle="caption-2"
              noOfLines={1}
              color="base.content.default"
            >
              {`/${potentialInternalLinkResource?.fullPermalink || ""}`}
            </Text>
          </VStack>

          <Button variant="clear" onClick={onPageLinkModalOpen}>
            Change
          </Button>
        </HStack>
      ) : (
        <Button variant="solid" w="full" onClick={onPageLinkModalOpen}>
          Select a page to link...
        </Button>
      )}
    </>
  )
}

const siteSchema = z.object({
  siteId: z.coerce.number(),
})

export function JsonFormsLinkControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const dataString = data && typeof data === "string" ? data : ""
  // NOTE: We need to pass in `siteId` but this component is automatically used by JsonForms
  // so we are unable to pass props down
  const { siteId } = useQueryParse(siteSchema)
  // NOTE: for reasons unknown, on initial load of the homepage,
  // the data passed to this component is '/'
  // which prevents this component from saving
  const dummyFile =
    !!dataString && dataString !== "/"
      ? new File(
          [],
          // NOTE: Technically guaranteed since our s3 filepath has a format of `/<site>/.../<filename>`
          dataString.split("/").at(-1) ?? "Uploaded file",
        )
      : undefined

  return (
    <Box>
      <LinkHrefEditor
        linkTypes={LINK_TYPES}
        value={dataString}
        onChange={(value) => handleChange(path, value)}
        label={label}
        isRequired={required}
        pageLinkElement={
          <PageLinkElement
            data={dataString}
            description={description}
            onChange={(value) => handleChange(path, value)}
          />
        }
        fileLinkElement={
          <FileAttachment
            siteId={siteId}
            setHref={(value) => handleChange(path, value)}
            value={dummyFile}
          />
        }
      />
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsLinkControl)

import type { UseRadioProps } from "@chakra-ui/react"
import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
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
  useRadio,
  useRadioGroup,
  VStack,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Button,
  FormLabel,
  Input,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { BiEnvelopeOpen, BiFile, BiFileBlank, BiLink } from "react-icons/bi"
import { z } from "zod"

import { ResourceSelector } from "~/components/ResourceSelector"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useZodForm } from "~/lib/form"
import { getResourceIdFromReferenceLink } from "~/utils/link"
import { trpc } from "~/utils/trpc"

const LINK_TYPES = {
  page: {
    icon: BiFileBlank,
    label: "Page",
  },
  external: {
    icon: BiLink,
    label: "External",
  },
  file: {
    icon: BiFile,
    label: "File",
  },
  email: {
    icon: BiEnvelopeOpen,
    label: "Email",
  },
} as const

export const jsonFormsLinkControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.LinkControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "link"),
  ),
)

interface PageLinkModalProps {
  data: string
  description?: string
  isOpen: boolean
  onClose: () => void
  onSave: (destination: string) => void
}

const PageLinkModal = ({
  data,
  description,
  isOpen,
  onClose,
  onSave,
}: PageLinkModalProps) => {
  const { handleSubmit, setValue, watch } = useZodForm({
    schema: z.object({
      destination: z.string(),
    }),
    defaultValues: {
      destination: "",
    },
  })

  const onSubmit = handleSubmit(({ destination }) => onSave(destination))
  const destination = watch("destination")

  const { data: selectedResource } =
    trpc.resource.getWithFullPermalink.useQuery({
      resourceId: destination,
    })

  useEffect(() => {
    // set default values here instead
    setValue("destination", getResourceIdFromReferenceLink(data))
    // only done once per every time the modal is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pr="4.5rem">Edit link</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <form onSubmit={onSubmit}>
            <FormControl isRequired>
              <FormLabel id="destination">
                {description || "When this link is clicked, open..."}
              </FormLabel>

              <ResourceSelector
                onChange={(resourceId) => setValue("destination", resourceId)}
                selectedResourceId={destination}
              />

              {destination !== "" && (
                <Box
                  mt="0.5rem"
                  p="0.75rem"
                  borderRadius="0.25rem"
                  bgColor="utility.feedback.info-subtle"
                >
                  <Text textStyle="caption-1" color="base.content.strong">
                    You selected /{selectedResource?.fullPermalink || ""}
                  </Text>
                </Box>
              )}
            </FormControl>
          </form>
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
            >
              Save changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const RadioCard = ({ children, ...rest }: PropsWithChildren<UseRadioProps>) => {
  const { getInputProps, getRadioProps } = useRadio(rest)

  return (
    <Box
      as="label"
      _first={{
        "> div": {
          borderLeftRadius: "base",
        },
      }}
      _last={{
        "> div": {
          borderRightRadius: "base",
        },
      }}
    >
      <input {...getInputProps()} />
      <Box
        {...getRadioProps()}
        cursor="pointer"
        border="1px solid"
        borderColor="base.divider.strong"
        bgColor="utility.ui"
        px="1rem"
        py="0.5rem"
        mx={0}
        _checked={{
          bgColor: "interaction.muted.main.active",
          color: "interaction.main.default",
          borderColor: "interaction.main.default",
        }}
        textTransform="none"
        fontWeight={500}
        lineHeight="1.25rem"
      >
        {children}
      </Box>
    </Box>
  )
}

interface RadioContentProps {
  selectedLinkType: string
  description?: string
  data: string
  handleChange: (value: string) => void
}

const RadioContent = ({
  selectedLinkType,
  description,
  data,
  handleChange,
}: RadioContentProps): JSX.Element => {
  const router = useRouter()
  const siteId = String(router.query.siteId)
  const {
    isOpen: isPageLinkModalOpen,
    onOpen: onPageLinkModalOpen,
    onClose: onPageLinkModalClose,
  } = useDisclosure()
  const potentialInternalLinkResourceId = getResourceIdFromReferenceLink(data)
  const { data: potentialInternalLinkResource } =
    trpc.resource.getWithFullPermalink.useQuery({
      resourceId: potentialInternalLinkResourceId,
    })

  switch (selectedLinkType) {
    case "page":
      return (
        <>
          <PageLinkModal
            data={data}
            description={description}
            isOpen={isPageLinkModalOpen}
            onClose={onPageLinkModalClose}
            onSave={(value) => {
              const referenceId = `[resource:${siteId}:${value}]`
              handleChange(referenceId)
              onPageLinkModalClose()
            }}
          />

          {potentialInternalLinkResourceId !== "" ? (
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
    case "external":
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="https://www.isomer.gov.sg"
        />
      )
    case "file":
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="File link"
        />
      )
    case "email":
      return (
        <Input
          type="text"
          value={data.startsWith("mailto:") ? data.slice("mailto:".length) : ""}
          onChange={(e) => handleChange(`mailto:${e.target.value}`)}
          placeholder="test@example.com"
        />
      )
    default:
      return <></>
  }
}

export function JsonFormsLinkControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const [selectedLinkType, setSelectedLinkType] = useState("page")

  const handleLinkTypeChange = (value: string) => {
    setSelectedLinkType(value)
    handleChange(path, "")
  }

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "link-type",
    defaultValue: "page",
    onChange: handleLinkTypeChange,
  })

  const dataString = data && typeof data === "string" ? data : ""

  return (
    <Box py="0.5rem">
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>

        <HStack {...getRootProps()} spacing={0}>
          {Object.entries(LINK_TYPES).map(([key, { icon, label }]) => {
            const radio = getRadioProps({ value: key })

            return (
              <RadioCard key={key} {...radio}>
                <HStack spacing={2}>
                  <Icon as={icon} fontSize="1.25rem" />
                  <Text textStyle="subhead-2">{label}</Text>
                </HStack>
              </RadioCard>
            )
          })}
        </HStack>

        <Box my="0.5rem">
          <RadioContent
            selectedLinkType={selectedLinkType}
            data={dataString}
            description={description}
            handleChange={(value) => handleChange(path, value)}
          />
        </Box>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsLinkControl)

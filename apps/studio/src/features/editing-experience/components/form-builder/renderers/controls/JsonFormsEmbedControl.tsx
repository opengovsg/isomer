import type { ControlProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  FormControl,
  HStack,
  Icon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Infobox,
  ModalCloseButton,
  Textarea,
} from "@opengovsg/design-system-react"
import {
  FORMSG_EMBED_URL_REGEXES,
  MAPS_EMBED_URL_REGEXES,
  VIDEO_EMBED_URL_REGEXES,
} from "@opengovsg/isomer-components"
import { BiLink } from "react-icons/bi"
import { z } from "zod"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useZodForm } from "~/lib/form"
import {
  EMBED_NAME_MAPPING,
  getEmbedNameFromUrl,
  getIframeSrc,
} from "../../../utils"

const SUPPORTED_FORMS = Object.keys(FORMSG_EMBED_URL_REGEXES).map(
  (key) => EMBED_NAME_MAPPING[key as keyof typeof FORMSG_EMBED_URL_REGEXES],
)

const SUPPORTED_MAPS = Object.keys(MAPS_EMBED_URL_REGEXES).map(
  (key) => EMBED_NAME_MAPPING[key as keyof typeof MAPS_EMBED_URL_REGEXES],
)

const SUPPORTED_VIDEOS = Object.keys(VIDEO_EMBED_URL_REGEXES).map(
  (key) => EMBED_NAME_MAPPING[key as keyof typeof VIDEO_EMBED_URL_REGEXES],
)

export const jsonFormsEmbedControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "embed"),
  ),
)

interface EmbedCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (embedCode: string) => void
  urlPattern?: string
}

function EmbedCodeModal({
  isOpen,
  onClose,
  onSave,
  urlPattern,
}: EmbedCodeModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useZodForm({
    mode: "onChange",
    schema: z.object({
      embedCode: z
        .string()
        .min(1, "Embed code is required")
        .refine(
          (value) => {
            const iframeSrc = getIframeSrc(value)

            if (!urlPattern || !iframeSrc) {
              return !!iframeSrc
            }

            return new RegExp(urlPattern).test(iframeSrc)
          },
          {
            message:
              "This code doesn’t look valid. Copy and paste the code as-is without modifications.",
          },
        ),
    }),
    reValidateMode: "onChange",
  })

  const onSubmit = handleSubmit(({ embedCode }) => {
    onClose()
    onSave(embedCode)
    reset()
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={onSubmit}>
          <ModalHeader mr="3.5rem">Insert embed code</ModalHeader>
          <ModalCloseButton size="lg" />

          <ModalBody>
            <FormControl mt="1rem" isRequired isInvalid={!!errors.embedCode}>
              <FormLabel description="The template may override settings like width and height of the iframe">
                Embed code
              </FormLabel>

              <Textarea
                placeholder="Paste embed code here"
                fontFamily="monospace"
                minAutosizeRows={5}
                {...register("embedCode")}
              />

              <FormErrorMessage>{errors.embedCode?.message}</FormErrorMessage>
            </FormControl>

            <Infobox size="sm" variant="info" mt="1.25rem">
              <Box>
                <Text>You can embed content from:</Text>
                <UnorderedList ml="1.5rem" mt="0.25rem">
                  <ListItem>Video: {SUPPORTED_VIDEOS.join(", ")}</ListItem>
                  <ListItem>Map: {SUPPORTED_MAPS.join(", ")}</ListItem>
                  <ListItem>Form: {SUPPORTED_FORMS.join(", ")}</ListItem>
                </UnorderedList>
              </Box>
            </Infobox>
          </ModalBody>

          <ModalFooter>
            <HStack spacing="0.75rem">
              <Button
                variant="clear"
                color="base.content.default"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" onClick={onSubmit} isDisabled={!isValid}>
                Save code
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export function JsonFormsEmbedControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
  schema,
}: ControlProps) {
  const {
    isOpen: isEmbedModalOpen,
    onOpen: onEmbedModalOpen,
    onClose: onEmbedModalClose,
  } = useDisclosure()

  const handleEmbedCodeSave = (embedCode: string) => {
    const src = getIframeSrc(embedCode)
    handleChange(path, src)
  }

  return (
    <>
      <EmbedCodeModal
        isOpen={isEmbedModalOpen}
        onClose={onEmbedModalClose}
        onSave={(embedCode) => handleEmbedCodeSave(embedCode)}
        urlPattern={schema.pattern}
      />

      <Box>
        <FormControl isRequired={required} isInvalid={!!errors}>
          <FormLabel description={description}>{label}</FormLabel>

          <HStack
            justifyContent="space-between"
            p="1rem"
            bgColor="utility.ui"
            borderRadius="0.25rem"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="base.divider.medium"
          >
            <VStack gap="0.25rem" align="start">
              <HStack gap="0.25rem">
                <Icon as={BiLink} />
                <Text textStyle="caption-1">
                  {getEmbedNameFromUrl(String(data || "")) ??
                    "External content"}
                </Text>
              </HStack>

              <Box>
                <Text
                  noOfLines={1}
                  wordBreak="break-all"
                  textStyle="caption-2"
                  color="base.content.medium"
                >
                  {String(data || "")}
                </Text>
              </Box>
            </VStack>

            <Button variant="clear" onClick={onEmbedModalOpen}>
              Edit
            </Button>
          </HStack>

          <FormErrorMessage>
            {label} {errors}
          </FormErrorMessage>
        </FormControl>
      </Box>
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsEmbedControl)

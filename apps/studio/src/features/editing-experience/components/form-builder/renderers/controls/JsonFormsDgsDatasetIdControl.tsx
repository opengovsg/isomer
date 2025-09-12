import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
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
  FormErrorMessage,
  FormLabel,
  Input,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { DGS_DATASET_ID_FORMAT } from "@opengovsg/isomer-components"
import { useDebounce } from "@uidotdev/usehooks"
import { BiLink } from "react-icons/bi"
import { z } from "zod"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useDgsMetadata } from "~/features/editing-experience/components/form-builder/hooks/useDgsMetadata"
import { getDgsIdFromString } from "~/features/editing-experience/utils"
import { useZodForm } from "~/lib/form"

export const jsonFormsDgsDatasetIdControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === DGS_DATASET_ID_FORMAT),
  ),
)

const generateDgsDatasetUrl = (datasetId: string | null) => {
  if (!datasetId) return ""
  return `https://data.gov.sg/datasets/${datasetId}/view`
}

interface DgsDatasetIdModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (datasetId: string) => void
  initialValue?: string
}

const DgsDatasetIdModal = ({
  isOpen,
  onClose,
  onSave,
  initialValue = "",
}: DgsDatasetIdModalProps) => {
  const initialValueUrl = generateDgsDatasetUrl(initialValue)

  const [inputValue, setInputValue] = useState(initialValueUrl)
  const debouncedInputValue = useDebounce(inputValue, 300)
  const isDebouncing = inputValue !== debouncedInputValue

  const datasetId = getDgsIdFromString({ string: debouncedInputValue })

  const { data: format, isLoading: isValidatingDataset } = useDgsMetadata({
    datasetId,
  })
  const isValidDataset = format === "CSV"

  const isLoading = isValidatingDataset || isDebouncing

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useZodForm({
    mode: "onChange",
    schema: z.object({
      datasetId: z
        .string()
        .min(1, "Dataset URL is required")
        .refine((value) => getDgsIdFromString({ string: value }) !== null, {
          message:
            "This doesn't look like a valid link from data.gov.sg. Check that you have the correct link and try again.",
        }),
    }),
    reValidateMode: "onChange",
  })

  // Update inputValue when initialValue changes (when modal opens)
  useEffect(() => {
    setInputValue(initialValueUrl)
  }, [initialValueUrl])

  // Handle dataset validation
  useEffect(() => {
    if (isValidatingDataset || !datasetId) return

    if (isValidDataset) {
      clearErrors("datasetId")
      return
    }

    setError("datasetId", {
      type: "manual",
      message: format
        ? "You can only link CSV datasets. Please check the dataset ID and try again."
        : "This doesn’t look like a valid link from data.gov.sg. Check that you have the correct link and try again.",
    })
  }, [
    datasetId,
    isValidDataset,
    format,
    isValidatingDataset,
    setError,
    clearErrors,
  ])

  const onSubmit = handleSubmit(() => {
    const extractedId = getDgsIdFromString({ string: debouncedInputValue })
    if (extractedId) {
      onClose()
      onSave(extractedId) // Save only the ID, not the full URL
    }
  })

  const handleClose = () => {
    onClose()
    setInputValue(initialValueUrl)
  }

  const FeedbackMessage = () => {
    if (errors.datasetId) {
      return <FormErrorMessage>{errors.datasetId.message}</FormErrorMessage>
    }
    if (isLoading) {
      return (
        <Text fontSize="sm" color="base.content.medium" mt="0.5rem">
          Validating dataset...
        </Text>
      )
    }
    if (isValidDataset) {
      return (
        <Text fontSize="sm" color="green.600" mt="0.5rem">
          ✓ Valid CSV dataset
        </Text>
      )
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={onSubmit}>
          <ModalHeader mr="3.5rem">Link a dataset</ModalHeader>
          <ModalCloseButton size="lg" />

          <ModalBody>
            <FormControl mt="1rem" isRequired isInvalid={!!errors.datasetId}>
              <FormLabel description="Navigate to your data on Data.gov.sg and copy the dataset’s link">
                Link to your CSV dataset
              </FormLabel>

              <Input
                fontFamily="monospace"
                placeholder="Paste dataset URL here"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  void register("datasetId").onChange(e)
                }}
                onBlur={register("datasetId").onBlur}
                name={register("datasetId").name}
                ref={register("datasetId").ref}
                isDisabled={isValidatingDataset}
              />

              <FeedbackMessage />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <HStack spacing="0.75rem">
              <Button
                variant="clear"
                color="base.content.default"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={onSubmit}
                isDisabled={!isValid || isLoading || !isValidDataset}
                isLoading={isLoading}
              >
                Save Dataset ID
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

interface JsonFormsDgsDatasetIdControlProps extends ControlProps {
  data: string
}

export function JsonFormsDgsDatasetIdControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
  errors,
  schema: _schema,
}: JsonFormsDgsDatasetIdControlProps) {
  const {
    isOpen: isDgsModalOpen,
    onOpen: onDgsModalOpen,
    onClose: onDgsModalClose,
  } = useDisclosure()

  const handleDatasetIdSave = (datasetId: string) => {
    handleChange(path, datasetId)
  }

  return (
    <>
      <DgsDatasetIdModal
        isOpen={isDgsModalOpen}
        onClose={onDgsModalClose}
        onSave={(datasetId) => handleDatasetIdSave(datasetId)}
        initialValue={data || ""}
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
                <Text textStyle="caption-1">Data.gov.sg</Text>
              </HStack>

              <Box>
                <Text
                  noOfLines={1}
                  wordBreak="break-all"
                  textStyle="caption-2"
                  color="base.content.medium"
                >
                  {generateDgsDatasetUrl(data)}
                </Text>
              </Box>
            </VStack>

            <Button variant="clear" onClick={onDgsModalOpen}>
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

export default withJsonFormsControlProps(JsonFormsDgsDatasetIdControl)

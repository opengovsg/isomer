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
import { BiLink } from "react-icons/bi"
import { z } from "zod"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { getDgsIdFromString } from "~/features/editing-experience/utils"
import { useZodForm } from "~/lib/form"
import { useDgsMetadata } from "./hooks/useDgsMetadata"

export const jsonFormsDgsDatasetIdControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TextControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === DGS_DATASET_ID_FORMAT),
  ),
)

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
  const [inputValue, setInputValue] = useState(initialValue)
  const [datasetId, setDatasetId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
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

  // Use the custom hook to validate dataset
  const { data: isValidDataset, isLoading: isValidatingDataset } =
    useDgsMetadata({ datasetId })

  // Update inputValue when initialValue changes (when modal opens)
  useEffect(() => {
    setInputValue(initialValue)
  }, [initialValue])

  // Update datasetId when input changes and is valid
  useEffect(() => {
    const extractedId = getDgsIdFromString({ string: inputValue })
    setDatasetId(extractedId)
  }, [inputValue])

  // Handle dataset validation
  useEffect(() => {
    if (datasetId && !isValidatingDataset) {
      if (isValidDataset === false) {
        setError("datasetId", {
          type: "manual",
          message:
            "You can only link CSV datasets. Please check the dataset ID and try again.",
        })
      } else if (isValidDataset === true) {
        clearErrors("datasetId")
      }
    }
  }, [datasetId, isValidDataset, isValidatingDataset, setError, clearErrors])

  const onSubmit = handleSubmit(({ datasetId }) => {
    // Extract the ID from URL or use as-is if it's already an ID
    const dgsId = getDgsIdFromString({ string: datasetId })
    if (dgsId) {
      onClose()
      onSave(dgsId)
      reset()
      setInputValue(initialValue)
      setDatasetId(null)
    }
  })

  const handleClose = () => {
    onClose()
    reset()
    setInputValue(initialValue)
    setDatasetId(null)
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

              <FormErrorMessage>{errors.datasetId?.message}</FormErrorMessage>

              {isValidatingDataset && (
                <Text fontSize="sm" color="base.content.medium" mt="0.5rem">
                  Validating dataset...
                </Text>
              )}
              {isValidDataset && (
                <Text fontSize="sm" color="green.600" mt="0.5rem">
                  ✓ Valid CSV dataset
                </Text>
              )}
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
                isDisabled={!isValid || isValidatingDataset || !isValidDataset}
                isLoading={isValidatingDataset}
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
                  https://data.gov.sg/datasets/{String(data || "")}/view
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

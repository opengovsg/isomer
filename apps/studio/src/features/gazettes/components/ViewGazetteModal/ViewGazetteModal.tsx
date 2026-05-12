import type { UseDisclosureReturn } from "@chakra-ui/react"
import {
  Box,
  Divider,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import {
  Button,
  Checkbox,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiInfoCircle, BiTrash } from "react-icons/bi"

interface ViewGazetteData {
  title: string
  category: string
  subcategory: string
  notificationNumber?: string
  fileId: string
  publishedAt: string
}

type ModalView = "view" | "delete"

interface ViewGazetteModalProps extends Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> {
  gazetteId: string | number
  data: ViewGazetteData
  initialView?: ModalView
}

export const ViewGazetteModal = ({
  isOpen,
  onClose,
  gazetteId,
  data,
  initialView = "view",
}: ViewGazetteModalProps): JSX.Element => {
  const [view, setView] = useState<ModalView>(initialView)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClose = () => {
    setView("view")
    setIsConfirmed(false)
    onClose()
  }

  const onDelete = () => {
    setIsDeleting(true)
    try {
      // TODO: Implement API call to delete gazette
      console.log("Deleting gazette:", gazetteId)
      handleClose()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        {view === "view" ? (
          <>
            <ModalHeader mr="3.5rem">View published Gazette</ModalHeader>
            <ModalCloseButton size="lg" />
            <ModalBody pb="2rem">
              <VStack alignItems="flex-start" spacing="1.5rem">
                <DataField label="Title" value={data.title} />

                <HStack spacing="2.5rem" w="100%" alignItems="flex-start">
                  <DataField label="Category" value={data.category} />
                  <DataField label="Subcategory" value={data.subcategory} />
                </HStack>

                <DataField
                  label="Notification Number"
                  value={data.notificationNumber ?? "-"}
                />

                <DataField label="File ID" value={data.fileId} />

                <DataField
                  label="Date of Publication"
                  value={data.publishedAt}
                />

                <Divider borderColor="base.divider.medium" />

                <Button
                  variant="outline"
                  colorScheme="critical"
                  leftIcon={<BiTrash />}
                  onClick={() => setView("delete")}
                >
                  Delete this Gazette permanently
                </Button>
              </VStack>
            </ModalBody>
          </>
        ) : (
          <>
            <ModalHeader mr="3.5rem">
              Delete this Gazette permanently?
            </ModalHeader>
            <ModalCloseButton size="lg" />
            <ModalBody>
              <Box
                bg="utility.feedback.critical-subtle"
                borderWidth="1px"
                borderColor="utility.feedback.critical"
                borderRadius="4px"
                p="1rem"
              >
                <HStack spacing="0.5rem" alignItems="flex-start" mb="1rem">
                  <Icon
                    as={BiInfoCircle}
                    color="utility.feedback.critical"
                    boxSize="1.25rem"
                    mt="0.125rem"
                  />
                  <Text textStyle="body-2" color="base.content.strong">
                    This Gazette will be deleted permanently. This cannot be
                    undone.
                  </Text>
                </HStack>
                <VStack alignItems="flex-start" spacing="0.75rem" pl="1.75rem">
                  <DeleteDataField label="Title" value={data.title} />
                  <DeleteDataField
                    label="Category / Subcategory"
                    value={`${data.category} / ${data.subcategory}`}
                  />
                  {data.notificationNumber && (
                    <DeleteDataField
                      label="Notification Number"
                      value={data.notificationNumber}
                    />
                  )}
                  <DeleteDataField label="File ID" value={data.fileId} />
                  <DeleteDataField
                    label="Date of Publication"
                    value={data.publishedAt}
                  />
                </VStack>
              </Box>
              <Box mt="1.5rem">
                <Checkbox
                  isChecked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                >
                  <Text textStyle="body-2">
                    Yes, delete this Gazette permanently
                  </Text>
                </Checkbox>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button
                mr={3}
                onClick={handleClose}
                variant="clear"
                colorScheme="neutral"
              >
                No, don't delete
              </Button>
              <Button
                colorScheme="critical"
                isDisabled={!isConfirmed}
                onClick={onDelete}
                isLoading={isDeleting}
              >
                Delete Gazette permanently
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

interface DataFieldProps {
  label: string
  value: string
}

const DataField = ({ label, value }: DataFieldProps) => {
  return (
    <Box w="100%">
      <Text textStyle="subhead-2" color="base.content.medium" mb="0.25rem">
        {label}
      </Text>
      <Text textStyle="subhead-2" color="base.content.strong">
        {value}
      </Text>
    </Box>
  )
}

const DeleteDataField = ({ label, value }: DataFieldProps) => {
  return (
    <Box>
      <Text textStyle="caption-1" color="base.content.medium">
        {label}
      </Text>
      <Text textStyle="body-2" color="base.content.strong">
        {value}
      </Text>
    </Box>
  )
}

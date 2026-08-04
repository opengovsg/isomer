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
  useToast,
} from "@opengovsg/design-system-react"
import { differenceInMinutes, format } from "date-fns"
import { useState } from "react"
import { BiInfoCircle, BiTrash } from "react-icons/bi"
import { ALLOWED_GAZETTE_DELETION_TIMEFRAME_IN_MINUTES } from "~/constants/gazette"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { trpc } from "~/utils/trpc"

import { GAZETTE_UNRESOLVED_TAG_LABEL } from "../../constants"
import { useGazetteSubcategoriesContext } from "../../contexts/GazetteSubcategoriesContext"

interface ViewGazetteData {
  title: string
  // Option uuids, or `null` when `page.tagged` held no uuid matching the
  // collection's taxonomy — see GazetteTableData.
  category: string | null
  subcategory: string | null
  notificationNumber?: string
  fileId: string
  publishedAt: Date | null
}

type ModalView = "view" | "delete"

interface ViewGazetteModalProps extends Pick<
  UseDisclosureReturn,
  "isOpen" | "onClose"
> {
  siteId: number
  gazetteId: string | number
  data: ViewGazetteData
  initialView?: ModalView
}

export const ViewGazetteModal = ({
  isOpen,
  onClose,
  siteId,
  gazetteId,
  data,
  initialView = "view",
}: ViewGazetteModalProps): JSX.Element => {
  const { categoryMap, subcategoryMap } = useGazetteSubcategoriesContext()

  const canDelete = data.publishedAt
    ? differenceInMinutes(new Date(), data.publishedAt) <=
      ALLOWED_GAZETTE_DELETION_TIMEFRAME_IN_MINUTES
    : false

  // Unresolved tags surface as an explicit "Unknown" rather than a blank or a
  // raw uuid — this modal is read-only, so it is the one place a Toppan user
  // can notice that a published gazette still carries the pre-cutover shape.
  const subcategoryLabel = data.subcategory
    ? (subcategoryMap[data.subcategory] ?? GAZETTE_UNRESOLVED_TAG_LABEL)
    : GAZETTE_UNRESOLVED_TAG_LABEL
  const categoryLabel = data.category
    ? (categoryMap[data.category] ?? GAZETTE_UNRESOLVED_TAG_LABEL)
    : GAZETTE_UNRESOLVED_TAG_LABEL

  const [view, setView] = useState<ModalView>(initialView)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const toast = useToast()
  const utils = trpc.useUtils()

  const { mutateAsync: deleteGazette, isPending: isDeleting } =
    trpc.gazette.delete.useMutation({
      onSuccess: () => {
        toast({
          status: "success",
          title: "Gazette deleted",
          description: "The gazette has been permanently deleted.",
          ...BRIEF_TOAST_SETTINGS,
        })
        void utils.gazette.list.invalidate()
        handleClose()
      },
      onError: (error) => {
        toast({
          status: "error",
          title: "Failed to delete gazette",
          description: error.message,
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const handleClose = () => {
    setView("view")
    setIsConfirmed(false)
    onClose()
  }

  const onDelete = async () => {
    await deleteGazette({
      siteId,
      gazetteId: Number(gazetteId),
    })
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
                  <DataField label="Category" value={categoryLabel} />
                  <DataField label="Subcategory" value={subcategoryLabel} />
                </HStack>

                <DataField
                  label="Notification Number"
                  value={data.notificationNumber ?? "-"}
                />

                <DataField label="File ID" value={data.fileId} />

                <DataField
                  label="Date of Publication"
                  value={
                    data.publishedAt
                      ? format(data.publishedAt, "dd/MM/yyyy, hh:mma")
                      : "-"
                  }
                />

                {canDelete && (
                  <>
                    <Divider borderColor="base.divider.medium" />

                    <Button
                      variant="outline"
                      colorScheme="critical"
                      leftIcon={<BiTrash />}
                      onClick={() => setView("delete")}
                    >
                      Delete this Gazette permanently
                    </Button>
                  </>
                )}
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
                    value={`${categoryLabel} / ${subcategoryLabel}`}
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
                    value={
                      data.publishedAt
                        ? format(data.publishedAt, "dd/MM/yyyy, hh:mma")
                        : "-"
                    }
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

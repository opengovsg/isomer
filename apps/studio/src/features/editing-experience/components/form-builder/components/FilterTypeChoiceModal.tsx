import {
  Box,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { ModalCloseButton } from "@opengovsg/design-system-react"
import { BiCalendar, BiPurchaseTag } from "react-icons/bi"

export type FilterType = "text" | "date"

interface FilterTypeChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: FilterType) => void
  isDateFilterEnabled?: boolean
}

interface FilterTypeCardProps {
  icon: typeof BiPurchaseTag
  label: string
  description: string
  onClick: () => void
  isDisabled?: boolean
}

function FilterTypeCard({
  icon: Icon,
  label,
  description,
  onClick,
  isDisabled = false,
}: FilterTypeCardProps) {
  return (
    <Box
      as="button"
      type="button"
      flex="1"
      textAlign="left"
      p="1rem"
      borderRadius="0.25rem"
      border="1px solid"
      borderColor="base.divider.medium"
      opacity={isDisabled ? 0.5 : 1}
      cursor={isDisabled ? "not-allowed" : "pointer"}
      _hover={
        isDisabled
          ? undefined
          : { borderColor: "interaction.main.default", bg: "grey.50" }
      }
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
    >
      <VStack align="start" spacing="0.5rem">
        <Icon fontSize="1.5rem" />
        <Text textStyle="subhead-1">{label}</Text>
        <Text textStyle="body-2" textColor="base.content.medium">
          {description}
        </Text>
      </VStack>
    </Box>
  )
}

// Shown when the admin clicks "Add a filter" — a filter is one of two types
// (text: an admin-defined option list; date: computed ended/ongoing/upcoming
// status). Selecting a card creates the filter with sensible defaults and
// immediately opens its detail drawer, same instant-creation pattern as the
// pre-existing single-type "Add a filter" button.
export function FilterTypeChoiceModal({
  isOpen,
  onClose,
  onSelect,
  isDateFilterEnabled = true,
}: FilterTypeChoiceModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Add a filter</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody pb="1.5rem">
          <HStack spacing="1rem" align="stretch">
            <FilterTypeCard
              icon={BiPurchaseTag}
              label="Text filter"
              description="Let visitors filter by a list of options you define, e.g. topics or categories."
              onClick={() => onSelect("text")}
            />
            <FilterTypeCard
              icon={BiCalendar}
              label="Date filter"
              description="Let visitors filter by whether an item is upcoming, ongoing, or has ended — computed automatically from dates you enter on each item."
              onClick={() => onSelect("date")}
              isDisabled={!isDateFilterEnabled}
            />
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

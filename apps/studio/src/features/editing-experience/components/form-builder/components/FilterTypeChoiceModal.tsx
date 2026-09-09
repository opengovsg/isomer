import type { TagCategoryType } from "@opengovsg/isomer-components"
import type { IconType } from "react-icons"
import {
  Box,
  HStack,
  Icon as ChakraIcon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
import { TAG_CATEGORY_TYPE } from "@opengovsg/isomer-components"
import { useState } from "react"
import { BiCalendar, BiFont } from "react-icons/bi"

import { DateFilter } from "./DateFilter"
import { TextFilter } from "./TextFilter"

export type FilterType = TagCategoryType

interface FilterTypeChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: FilterType) => void
  isDateFilterEnabled?: boolean
}

interface FilterTypeCardProps {
  imageSrc: React.ReactNode
  icon: IconType
  label: string
  description: string
  isSelected: boolean
  onSelect: () => void
}

function FilterTypeCard({
  imageSrc,
  icon: IconComponent,
  label,
  description,
  isSelected,
  onSelect,
}: FilterTypeCardProps) {
  const titleColor = isSelected ? "base.content.brand" : "base.content.default"
  const iconColor = isSelected
    ? "interaction.main.default"
    : "base.content.default"

  return (
    <Box
      as="button"
      type="button"
      display="flex"
      flexDirection="column"
      w="300px"
      flexShrink={0}
      textAlign="left"
      borderRadius="0.25rem"
      border="0.125rem solid"
      borderColor={isSelected ? "base.divider.brand" : "base.divider.medium"}
      bg={isSelected ? "interaction.muted.main.active" : "transparent"}
      boxShadow={isSelected ? "sm" : undefined}
      cursor="pointer"
      overflow="hidden"
      p={0}
      aria-pressed={isSelected}
      _hover={
        isSelected
          ? {
              borderColor: "base.divider.brand",
              bg: "interaction.muted.main.active",
              boxShadow: "sm",
            }
          : {
              borderColor: "base.divider.medium",
              bg: "interaction.muted.main.hover",
            }
      }
      onClick={onSelect}
    >
      <Box bg="base.canvas.default">{imageSrc}</Box>
      <Box p="1.25rem">
        <VStack align="start" spacing="0.5rem">
          <ChakraIcon
            as={IconComponent}
            fontSize="1.5rem"
            color={iconColor}
            aria-hidden
          />
          <Text textStyle="subhead-1" color={titleColor}>
            {label}
          </Text>
          <Text textStyle="caption-2" color="base.content.medium">
            {description}
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}

export function FilterTypeChoiceModal({
  isOpen,
  onClose,
  onSelect,
  isDateFilterEnabled = true,
}: FilterTypeChoiceModalProps) {
  const [selectedType, setSelectedType] = useState<FilterType>(
    TAG_CATEGORY_TYPE.Text,
  )

  const handleClose = () => {
    setSelectedType(TAG_CATEGORY_TYPE.Text)
    onClose()
  }

  const handleAddFilter = () => {
    onSelect(selectedType)
    setSelectedType(TAG_CATEGORY_TYPE.Text)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Add a filter</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody pb="1.5rem">
          <HStack spacing="1rem" align="stretch">
            <FilterTypeCard
              imageSrc={<TextFilter />}
              icon={BiFont}
              label="Text filter"
              description="Use it for: Publication Type, Audience, Topic, Categories, Levels..."
              isSelected={selectedType === TAG_CATEGORY_TYPE.Text}
              onSelect={() => setSelectedType(TAG_CATEGORY_TYPE.Text)}
            />
            <FilterTypeCard
              imageSrc={<DateFilter />}
              icon={BiCalendar}
              label="Date filter"
              description="Use it for: Event date, Registration deadline, Consultation period, Procurement dates..."
              isSelected={selectedType === TAG_CATEGORY_TYPE.Date}
              onSelect={() => setSelectedType(TAG_CATEGORY_TYPE.Date)}
            />
          </HStack>
        </ModalBody>
        <ModalFooter pt="0">
          <Button
            variant="solid"
            onClick={handleAddFilter}
            isDisabled={
              selectedType === TAG_CATEGORY_TYPE.Date && !isDateFilterEnabled
            }
          >
            Add filter
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

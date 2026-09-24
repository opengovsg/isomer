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
import { NextImage } from "~/components/NextImage"

export type FilterType = TagCategoryType

interface FilterTypeChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: FilterType) => void
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
      <Box
        bg="base.canvas.default"
        h="9.375rem"
        w="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {imageSrc}
      </Box>
      <Box p="1.25rem">
        <VStack align="start" spacing="0.5rem">
          <ChakraIcon
            as={IconComponent}
            fontSize="1.5rem"
            color={
              isSelected ? "interaction.main.default" : "base.content.default"
            }
            aria-hidden
          />
          <Text
            textStyle="subhead-1"
            color={isSelected ? "base.content.brand" : "base.content.default"}
          >
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
              imageSrc={
                <NextImage
                  src="/assets/filter-type-card/text_filter_card.png"
                  width={300}
                  height={137}
                  alt=""
                  aria-hidden
                  pointerEvents="none"
                />
              }
              icon={BiFont}
              label="Text filter"
              description="Use it for: Publication Type, Audience, Topic, Categories, Levels..."
              isSelected={selectedType === TAG_CATEGORY_TYPE.Text}
              onSelect={() => setSelectedType(TAG_CATEGORY_TYPE.Text)}
            />
            <FilterTypeCard
              imageSrc={
                <NextImage
                  src="/assets/filter-type-card/date_filter_card.png"
                  width={300}
                  height={150}
                  alt=""
                  aria-hidden
                  pointerEvents="none"
                />
              }
              icon={BiCalendar}
              label="Date filter"
              description="Use it for: Event date, Registration deadline, Consultation period, Procurement dates..."
              isSelected={selectedType === TAG_CATEGORY_TYPE.Date}
              onSelect={() => setSelectedType(TAG_CATEGORY_TYPE.Date)}
            />
          </HStack>
        </ModalBody>
        <ModalFooter pt="0">
          <Button variant="solid" onClick={handleAddFilter}>
            Add filter
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

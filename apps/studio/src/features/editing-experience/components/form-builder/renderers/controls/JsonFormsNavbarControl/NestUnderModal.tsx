import type { IconType } from "react-icons"
import type { PartialDeep } from "type-fest"
import {
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
import { dataAttr } from "@chakra-ui/utils"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiHomeAlt, BiLink } from "react-icons/bi"

import type { NavbarItemIndices, NavbarItems } from "./types"
import type { NestDestination } from "./utils"
import { DEFAULT_NAVBAR_ITEM_TITLE } from "./constants"

interface NestDestinationItemProps {
  icon: IconType
  label: string
  caption?: string
  isSelected: boolean
  isDisabled?: boolean
  isIndented?: boolean
  onClick: () => void
}

const NestDestinationItem = ({
  icon,
  label,
  caption,
  isSelected,
  isDisabled,
  isIndented,
  onClick,
}: NestDestinationItemProps) => {
  return (
    <Button
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color="base.content.default"
      height="fit-content"
      alignItems="flex-start"
      gap="0.25rem"
      {...(isIndented && { pl: "2rem" })}
      data-selected={dataAttr(isSelected)}
      _selected={{
        color: "interaction.main.default",
        bg: "interaction.muted.main.active",
        _hover: {
          color: "interaction.main.default",
          bg: "interaction.muted.main.active",
        },
      }}
      leftIcon={<Icon as={icon} />}
      isDisabled={isDisabled}
      onClick={onClick}
    >
      <VStack alignItems="flex-start" textAlign="left" gap="0.25rem">
        <Text noOfLines={1} textStyle="caption-1">
          {label}
        </Text>
        {caption && (
          <Text noOfLines={1} textStyle="caption-2">
            {caption}
          </Text>
        )}
      </VStack>
    </Button>
  )
}

interface NestUnderModalProps {
  isOpen: boolean
  onClose: () => void
  onNest: (destination: NestDestination) => void
  source: NavbarItemIndices
  items: PartialDeep<NavbarItems["items"][number]>[]
  maxItems?: number
}

export const NestUnderModal = ({
  isOpen,
  onClose,
  onNest,
  source,
  items,
  maxItems,
}: NestUnderModalProps): JSX.Element => {
  const [selectedDestination, setSelectedDestination] =
    useState<NestDestination | null>(null)

  const isSourceSubItem = source.parentIndex !== undefined
  const sourceItem =
    source.parentIndex !== undefined
      ? items[source.parentIndex]?.items?.[source.index]
      : items[source.index]
  const label = sourceItem?.name || DEFAULT_NAVBAR_ITEM_TITLE

  const isMaxItemsReached = !!(maxItems && items.length >= maxItems)

  const getFirstLevelCaption = () => {
    if (!isSourceSubItem) {
      return "Current location"
    }

    if (isMaxItemsReached) {
      return `You can only have up to ${maxItems} first-level links.`
    }

    return "First level of the navigation bar"
  }

  const getItemCaption = (
    item: PartialDeep<NavbarItems["items"][number]>,
    isCurrentParent: boolean,
  ) => {
    if (isCurrentParent) {
      return "Current location"
    }

    const subItemsCount = item.items?.length ?? 0

    if (subItemsCount > 0) {
      return `${subItemsCount} nested ${subItemsCount > 1 ? "links" : "link"}`
    }

    return "Single link"
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Nest “{label}” under...</ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <VStack
            w="full"
            alignItems="stretch"
            gap="0.25rem"
            border="1px solid"
            borderColor="base.divider.strong"
            borderRadius="0.25rem"
            p="0.5rem"
            maxH="17.5rem"
            overflowY="auto"
          >
            <NestDestinationItem
              icon={BiHomeAlt}
              label="First level"
              caption={getFirstLevelCaption()}
              isSelected={selectedDestination === "root"}
              isDisabled={!isSourceSubItem || isMaxItemsReached}
              onClick={() => setSelectedDestination("root")}
            />

            {items.map((item, index) => {
              // The source item itself is not a valid destination
              if (!isSourceSubItem && index === source.index) {
                return null
              }

              const isCurrentParent = index === source.parentIndex

              return (
                <NestDestinationItem
                  key={index}
                  icon={BiLink}
                  label={item.name || DEFAULT_NAVBAR_ITEM_TITLE}
                  caption={getItemCaption(item, isCurrentParent)}
                  isSelected={selectedDestination === index}
                  isDisabled={isCurrentParent}
                  isIndented
                  onClick={() => setSelectedDestination(index)}
                />
              )
            })}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="solid"
              isDisabled={selectedDestination === null}
              onClick={() => {
                if (selectedDestination !== null) {
                  onNest(selectedDestination)
                }
              }}
            >
              Move here
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

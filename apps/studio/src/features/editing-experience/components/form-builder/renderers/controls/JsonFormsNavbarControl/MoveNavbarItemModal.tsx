import {
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"

export interface MoveNavbarItemDestination {
  key: string
  label: string
  isDisabled?: boolean
}

interface MoveNavbarItemModalProps {
  isOpen: boolean
  label: string
  /** Top-level items (and "Top level" itself, where applicable) this item can be nested under */
  destinations: MoveNavbarItemDestination[]
  onClose: () => void
  onMove: (destinationKey: string) => void
}

export const MoveNavbarItemModal = ({
  isOpen,
  label,
  destinations,
  onClose,
  onMove,
}: MoveNavbarItemModalProps): JSX.Element => {
  const handleMove = (destinationKey: string) => {
    onMove(destinationKey)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Move “{label}” to…</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          {destinations.length === 0 ? (
            <Text textStyle="body-2" textColor="base.content.medium">
              There’s nowhere else to move “{label}” to.
            </Text>
          ) : (
            <VStack align="stretch" spacing="0.5rem">
              {destinations.map((destination) => (
                <Tooltip
                  key={destination.key}
                  label={
                    destination.isDisabled
                      ? "You can only have up to 8 first-level links."
                      : undefined
                  }
                  hasArrow
                >
                  <Box
                    as="button"
                    type="button"
                    onClick={() => {
                      if (!destination.isDisabled) {
                        handleMove(destination.key)
                      }
                    }}
                    disabled={destination.isDisabled}
                    px="0.75rem"
                    py="0.625rem"
                    borderWidth="1px"
                    borderStyle="solid"
                    borderColor="base.divider.medium"
                    borderRadius="0.375rem"
                    bgColor="utility.ui"
                    textAlign="start"
                    w="full"
                    opacity={destination.isDisabled ? 0.5 : 1}
                    cursor={destination.isDisabled ? "not-allowed" : "pointer"}
                    _hover={
                      destination.isDisabled
                        ? undefined
                        : {
                            borderColor: "interaction.main-subtle.hover",
                            bg: "interaction.muted.main.hover",
                          }
                    }
                  >
                    <Text
                      textStyle="body-2"
                      textColor="base.content.default"
                      noOfLines={1}
                    >
                      {destination.label}
                    </Text>
                  </Box>
                </Tooltip>
              ))}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="clear" colorScheme="neutral" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

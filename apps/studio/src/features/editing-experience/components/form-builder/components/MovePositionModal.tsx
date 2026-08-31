import {
  Box,
  HStack,
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
import { Fragment } from "react"
import { BiPlus } from "react-icons/bi"

export interface MovePositionModalSibling {
  key: string
  label: string
}

interface MovePositionModalProps {
  isOpen: boolean
  label: string
  /** Ordered list of the other items in the same list, excluding the one being moved */
  siblings: MovePositionModalSibling[]
  onClose: () => void
  /** Index (0..siblings.length) of the slot to insert the moved item before */
  onMove: (targetIndex: number) => void
}

export const MovePositionModal = ({
  isOpen,
  label,
  siblings,
  onClose,
  onMove,
}: MovePositionModalProps): JSX.Element => {
  const handleMove = (targetIndex: number) => {
    onMove(targetIndex)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">Move “{label}”</ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          {siblings.length === 0 ? (
            <Text textStyle="body-2" textColor="base.content.medium">
              There’s nothing else here to move “{label}” relative to.
            </Text>
          ) : (
            <VStack align="stretch" spacing={0}>
              <InsertionPoint onClick={() => handleMove(0)} />

              {siblings.map((sibling, index) => (
                <Fragment key={sibling.key}>
                  <Box
                    px="0.75rem"
                    py="0.5rem"
                    borderWidth="1px"
                    borderStyle="solid"
                    borderColor="base.divider.medium"
                    borderRadius="0.375rem"
                    bgColor="utility.ui"
                  >
                    <Text
                      textStyle="body-2"
                      textColor="base.content.default"
                      noOfLines={1}
                    >
                      {sibling.label}
                    </Text>
                  </Box>

                  <InsertionPoint onClick={() => handleMove(index + 1)} />
                </Fragment>
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

const InsertionPoint = ({ onClick }: { onClick: () => void }) => (
  <HStack
    as="button"
    type="button"
    onClick={onClick}
    w="full"
    justifyContent="center"
    py="0.375rem"
    color="interaction.main.default"
    _hover={{ color: "interaction.main.hover" }}
    layerStyle="focusRing"
  >
    <BiPlus />
    <Text textStyle="caption-2">Move here</Text>
  </HStack>
)

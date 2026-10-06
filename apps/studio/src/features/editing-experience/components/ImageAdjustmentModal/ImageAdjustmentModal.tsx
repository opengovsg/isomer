import type { ImageAdjustment } from "@opengovsg/isomer-components"
import {
  Box,
  Grid,
  GridItem,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
import { useState } from "react"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { DiscardChangesModal } from "../DiscardChangesModal/DiscardChangesModal"
import { AdjustmentPreview } from "./AdjustmentPreview"

interface ImageAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  config: AdjustmentConfig
  src: string
  value?: ImageAdjustment
  onSave: (next: ImageAdjustment | undefined) => void
}

export const ImageAdjustmentModal = ({
  isOpen,
  onClose,
  config,
  src,
  value,
  onSave,
}: ImageAdjustmentModalProps): JSX.Element => {
  const [draft, setDraft] = useState<ImageAdjustment | undefined>(value)
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()

  // Check if draft differs from original value.
  const isModified = JSON.stringify(draft) !== JSON.stringify(value)

  const handleClose = () => {
    if (isModified) {
      onDiscardChangesModalOpen()
    } else {
      onClose()
    }
  }

  const handleDiscard = () => {
    setDraft(value)
    onDiscardChangesModalClose()
  }

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  const handleReset = () => {
    setDraft(undefined)
  }

  const handleUndo = () => {
    setDraft(value)
  }

  return (
    <>
      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={() => {
          handleDiscard()
          onClose()
        }}
      />

      <Modal
        size={{ base: "full", md: "6xl" }}
        isOpen={isOpen}
        onClose={handleClose}
      >
        <ModalOverlay />
        <ModalContent overflow="hidden">
          <ModalHeader pr="4.5rem">
            <HStack spacing={3}>
              <Text as="span" textStyle="h5" fontWeight="semibold">
                Adjust image
              </Text>
            </HStack>
          </ModalHeader>

          <ModalCloseButton size="lg" onClick={handleClose} />

          <ModalBody overflow="auto" p="2rem">
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap="2rem"
              w="100%"
              h="100%"
            >
              {/* Canvas Area: Live Breakpoint Preview */}
              <GridItem>
                <AdjustmentPreview
                  src={src}
                  adjustment={draft}
                  previewStates={config.previewStates}
                  scrim={config.scrim}
                />
              </GridItem>

              {/* Controls Panel */}
              <GridItem>
                <VStack align="start" spacing="1.5rem" w="100%">
                  {/* Focal Point Section */}
                  {config.focalEnabled && (
                    <Box w="100%">
                      <Text textStyle="h6" fontWeight="semibold" mb="0.5rem">
                        Focal point
                      </Text>
                      <Text textStyle="body-2" color="base.content.medium">
                        Focal point control will be implemented in W0-H
                      </Text>
                    </Box>
                  )}

                  {/* Crop Mode Section */}
                  {config.cropMode !== "none" && (
                    <Box w="100%">
                      <Text textStyle="h6" fontWeight="semibold" mb="0.5rem">
                        Crop mode
                      </Text>
                      <Text textStyle="body-2" color="base.content.medium">
                        {config.cropMode === "fixed"
                          ? "Fixed aspect ratio"
                          : "Custom crop"}
                      </Text>
                    </Box>
                  )}

                  {/* Preserve-only note */}
                  {config.cropMode === "none" && (
                    <Box
                      w="100%"
                      p="1rem"
                      bgColor="utility.ui"
                      borderRadius="0.25rem"
                      borderWidth="1px"
                      borderColor="base.divider.medium"
                    >
                      <Text textStyle="body-2">
                        This image cannot be cropped. Only focal point and
                        rotation adjustments are available.
                      </Text>
                    </Box>
                  )}

                  {/* Locked Ratios */}
                  {config.lockedRatios && config.lockedRatios.length > 0 && (
                    <Box w="100%">
                      <Text textStyle="h6" fontWeight="semibold" mb="0.5rem">
                        Aspect ratios
                      </Text>
                      <VStack align="start" spacing="0.25rem">
                        {config.lockedRatios.map((ratio, idx) => (
                          <Text
                            key={idx}
                            textStyle="body-2"
                            color="base.content.medium"
                          >
                            {ratio.width}:{ratio.height}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {/* Preview States */}
                  {config.previewStates.length > 0 && (
                    <Box w="100%">
                      <Text textStyle="h6" fontWeight="semibold" mb="0.5rem">
                        Preview states
                      </Text>
                      <VStack align="start" spacing="0.25rem">
                        {config.previewStates.map((state) => (
                          <Text
                            key={state.id}
                            textStyle="body-2"
                            color="base.content.medium"
                          >
                            {state.label}
                            {state.viewportWidth &&
                              ` (${state.viewportWidth}px)`}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {/* Overlay */}
                  {config.scrim && (
                    <Box w="100%">
                      <Text textStyle="h6" fontWeight="semibold" mb="0.5rem">
                        Overlay
                      </Text>
                      <Text textStyle="body-2" color="base.content.medium">
                        {config.scrim.className}
                      </Text>
                    </Box>
                  )}

                  {/* Pre-upload Copy */}
                  {config.preUploadCopy && (
                    <Box
                      w="100%"
                      p="1rem"
                      bgColor="utility.ui"
                      borderRadius="0.25rem"
                      borderWidth="1px"
                      borderColor="base.divider.medium"
                    >
                      <Text textStyle="body-2">{config.preUploadCopy}</Text>
                    </Box>
                  )}

                  <Spacer />
                </VStack>
              </GridItem>
            </Grid>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="base.divider.medium">
            <HStack spacing="0.75rem" w="100%">
              <Button
                variant="clear"
                colorScheme="neutral"
                onClick={handleReset}
              >
                Reset image
              </Button>
              <Button
                variant="clear"
                colorScheme="neutral"
                onClick={handleUndo}
                isDisabled={!isModified}
              >
                Undo changes
              </Button>
              <Spacer />
              <Button
                variant="clear"
                colorScheme="neutral"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button variant="solid" onClick={handleSave}>
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

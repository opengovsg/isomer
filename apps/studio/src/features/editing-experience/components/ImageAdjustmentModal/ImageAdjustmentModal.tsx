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
import {
  Button,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { useRef, useState } from "react"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { DiscardChangesModal } from "../DiscardChangesModal/DiscardChangesModal"
import { getAssetUploadBackoffBudgetMs } from "../form-builder/hooks/useAssetUpload"
import { ensureAdjustment } from "./adjustmentDraft"
import { AdjustmentPreview } from "./AdjustmentPreview"
import { CropFocalControl } from "./controls/CropFocalControl"
import {
  focalToWholeImagePoint,
  pointToCropRelativeFocal,
} from "./controls/focalGeometry"
import {
  resolveOriginalKey,
  useSaveImageAdjustment,
} from "./useSaveImageAdjustment"

// Upper bound on how long we wait for a save (bake → presign → upload) before
// surfacing an error and unlocking the modal, so a hung network request can't
// trap the editor in a permanently disabled modal. Must exceed the asset
// upload's own retry backoff budget, or we'd time out saves that are still
// retrying and about to succeed.
const SAVE_TIMEOUT_MS = getAssetUploadBackoffBudgetMs() + 15_000

interface ImageAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  config: AdjustmentConfig
  src: string
  value?: ImageAdjustment
  // So the preview can render the actual published component rather than an approximation.
  block: unknown
  imageFieldName: string
  siteId: number
  resourceId?: string
  onSave: (result: {
    src: string
    imageAdjustment: ImageAdjustment | undefined
  }) => void
}

export const ImageAdjustmentModal = ({
  isOpen,
  onClose,
  config,
  src,
  block,
  imageFieldName,
  value,
  siteId,
  resourceId,
  onSave,
}: ImageAdjustmentModalProps): JSX.Element => {
  const [draft, setDraft] = useState<ImageAdjustment | undefined>(value)
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const toast = useToast()
  const { save } = useSaveImageAdjustment({
    siteId,
    resourceId,
  })
  // Drives UI locking during a save. Local (not the hook's isSaving) so the
  // save timeout below can unlock the modal even if the underlying upload hangs.
  const [isSaving, setIsSaving] = useState(false)
  // Tracks the REAL underlying save, independent of the UI-facing timeout below:
  // the timeout only abandons the promise, it can't cancel the actual upload, so
  // without this guard a retry would start a second upload while the first runs on.
  const savePromiseRef = useRef<ReturnType<typeof save> | null>(null)

  const isModified = JSON.stringify(draft) !== JSON.stringify(value)

  // Crop/focal editing and preview must bake from the TRUE original, never a
  // previous bake, so re-encode loss can't compound across edits.
  const originalSrc = `/${resolveOriginalKey(src, draft ?? {})}`

  const handleClose = () => {
    // Block dismissal mid-save — otherwise a discard followed by the completing
    // upload would write the discarded edit back via onSave. Check the real
    // promise, not just isSaving: the save timeout clears isSaving while the
    // underlying upload keeps running in the background.
    if (isSaving || savePromiseRef.current) return
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

  const handleSave = async () => {
    // Nothing to persist — just close without re-baking/uploading.
    if (!isModified || !draft) {
      onClose()
      return
    }

    // A previous save timed out from the UI's perspective but is still running
    // in the background — don't start a second, concurrent one.
    if (savePromiseRef.current) {
      toast({
        title: "Still saving the previous change",
        description: "Please wait for it to finish before saving again.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsSaving(true)
    const savePromise = save(src, draft)
    savePromiseRef.current = savePromise
    void savePromise.finally(() => {
      savePromiseRef.current = null
    })

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await Promise.race([
        savePromise,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error("Saving took too long. Please try again.")),
            SAVE_TIMEOUT_MS,
          )
        }),
      ])
      onSave(result)
      onClose()
    } catch (err) {
      toast({
        title: "Failed to save image adjustment",
        description: err instanceof Error ? err.message : "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (value?.originalKey) {
      onSave({ src: `/${value.originalKey}`, imageAdjustment: undefined })
      onClose()
    } else {
      setDraft(undefined)
    }
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
        closeOnOverlayClick={!isSaving}
        closeOnEsc={!isSaving}
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

          <ModalCloseButton
            size="lg"
            onClick={handleClose}
            isDisabled={isSaving}
          />

          <ModalBody overflow="auto" p="2rem">
            <Grid
              templateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap="2rem"
              w="100%"
              h="100%"
            >
              <GridItem>
                <AdjustmentPreview
                  src={src}
                  originalSrc={originalSrc}
                  adjustment={draft}
                  previewStates={config.previewStates}
                  scrim={config.scrim}
                  block={block}
                  imageFieldName={imageFieldName}
                />
              </GridItem>

              <GridItem>
                <VStack align="start" spacing="1.5rem" w="100%">
                  {/* One shared canvas: focal is only meaningful relative to the crop. */}
                  {(config.cropMode !== "none" || config.focalEnabled) && (
                    <CropFocalControl
                      src={originalSrc}
                      crop={draft?.crop}
                      focal={draft?.focal}
                      cropMode={config.cropMode}
                      lockedRatio={
                        config.cropMode === "fixed"
                          ? config.lockedRatios?.[0]
                          : undefined
                      }
                      focalEnabled={config.focalEnabled}
                      onCropChange={(crop) =>
                        setDraft((d) => {
                          const base = ensureAdjustment(d)
                          // Focal is stored crop-relative; re-base it against
                          // the new crop so a focal placed before this crop
                          // edit still points at the same spot on the image.
                          const focal = pointToCropRelativeFocal(
                            focalToWholeImagePoint(base.focal, base.crop),
                            crop,
                          )
                          return { ...base, crop, focal }
                        })
                      }
                      onFocalChange={(focal) =>
                        setDraft((d) => ({ ...ensureAdjustment(d), focal }))
                      }
                      isDisabled={isSaving}
                    />
                  )}

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
                        This image cannot be cropped. Only focal point
                        adjustments are available.
                      </Text>
                    </Box>
                  )}

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

                  {config.scrim && (
                    <Box w="100%">
                      <Text textStyle="h6" fontWeight="semibold" mb="0.5rem">
                        Overlay
                      </Text>
                      <Text textStyle="body-2" color="base.content.medium">
                        {config.scrim.label}
                      </Text>
                    </Box>
                  )}

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
                isDisabled={isSaving}
              >
                Reset image
              </Button>
              <Button
                variant="clear"
                colorScheme="neutral"
                onClick={handleUndo}
                isDisabled={!isModified || isSaving}
              >
                Undo changes
              </Button>
              <Spacer />
              <Button
                variant="clear"
                colorScheme="neutral"
                onClick={handleClose}
                isDisabled={isSaving}
              >
                Cancel
              </Button>
              <Button variant="solid" onClick={handleSave} isLoading={isSaving}>
                Save
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

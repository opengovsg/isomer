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
  Infobox,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { useMemo, useRef, useState } from "react"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { DiscardChangesModal } from "../DiscardChangesModal/DiscardChangesModal"
import { ensureAdjustment } from "./adjustmentDraft"
import { AdjustmentPreview } from "./AdjustmentPreview"
import { CropFocalControl } from "./controls/CropFocalControl"
import { defaultCropRect } from "./controls/cropGeometry"
import {
  flipPointH,
  flipPointV,
  flipRectH,
  flipRectV,
  nextRotation,
  rotatePointCcw,
  rotatePointCw,
  rotateRectCcw,
  rotateRectCw,
} from "./controls/displayTransform"
import { TransformControl } from "./controls/TransformControl"
import { computeLowResWarning } from "./resolutionWarning"
import {
  resolveOriginalKey,
  useSaveImageAdjustment,
} from "./useSaveImageAdjustment"

// Upper bound on how long we wait for a save (bake → presign → upload) before
// surfacing an error and unlocking the modal, so a hung network request can't
// trap the editor in a permanently disabled modal.
const SAVE_TIMEOUT_MS = 30_000

interface ImageAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  config: AdjustmentConfig
  src: string
  value?: ImageAdjustment
  // The real block content + the name of the field holding the image, so the
  // preview can render the actual published component (real copy, scrim,
  // crop frame) rather than an approximation.
  block: unknown
  imageFieldName: string
  // The field's immediate host (for an array-nested InfoCards image, the card
  // object) — read by the config's focalEnabledFor/previewObjectFitFor to resolve
  // the controls for this card's current imageFit.
  fieldHost: unknown
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
  fieldHost,
  value,
  siteId,
  resourceId,
  onSave,
}: ImageAdjustmentModalProps): JSX.Element => {
  // Tier C (InfoCards): focal and the preview's object-fit depend on the card's
  // current imageFit; other components have no resolver and fall back to the
  // static config / cover.
  const focalEnabled = config.focalEnabledFor
    ? config.focalEnabledFor(fieldHost)
    : config.focalEnabled
  const previewObjectFit = config.previewObjectFitFor?.(fieldHost) ?? "cover"
  const [draft, setDraft] = useState<ImageAdjustment | undefined>(value)
  // The source image's true pixel aspect ratio, reported by CropFocalControl
  // once its <img> loads — needed so "Reset crop & focal" can seed the same
  // ratio-correct crop the control itself would (see defaultCropRect).
  // `undefined` until the image loads: for a locked ratio the reset is disabled
  // until then, so a wrong (square-assumed) crop can never be baked.
  const [imageAspect, setImageAspect] = useState<number | undefined>(undefined)
  // The source image's true pixel dimensions, reported by CropFocalControl once
  // its <img> loads — used to warn when the cropped region is too low-res for
  // the component's rendered frame.
  const [naturalSize, setNaturalSize] = useState<
    { width: number; height: number } | undefined
  >(undefined)
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
  // Tracks the REAL underlying save (bake -> presign -> upload), independent
  // of the UI-facing `isSaving`/timeout below. The timeout exists so a hung
  // request can't trap the editor in a disabled modal, but it only abandons
  // the promise -- it doesn't cancel the actual upload. Without this guard,
  // retrying after a timeout starts a second upload while the first is still
  // running in the background.
  const savePromiseRef = useRef<ReturnType<typeof save> | null>(null)

  // Check if draft differs from original value.
  const isModified = JSON.stringify(draft) !== JSON.stringify(value)

  const lockedRatio =
    config.cropMode === "fixed" ? config.lockedRatios?.[0] : undefined

  // Warn when the cropped region can't fill this component's largest rendered
  // frame even at 1x (see computeLowResWarning).
  const lowResWarning = useMemo(
    () =>
      computeLowResWarning({
        naturalSize,
        crop: draft?.crop,
        rotate: draft?.rotate,
        lockedRatio,
        maxRenderedWidthPx: config.maxRenderedWidthPx,
      }),
    [
      naturalSize,
      config.maxRenderedWidthPx,
      draft?.crop,
      draft?.rotate,
      lockedRatio,
    ],
  )

  // The crop/focal canvas and the live preview must both edit/bake from the
  // TRUE original, never a previous bake — same rule useSaveImageAdjustment
  // follows (RFC: re-encode loss must not compound). On a first edit `src`
  // IS the original; on a re-edit, `src` is the previous bake and only
  // `draft.originalKey` points at the true original.
  const originalSrc = `/${resolveOriginalKey(src, draft ?? {})}`

  const handleClose = () => {
    // Block dismissal while a save is in flight — otherwise the editor could
    // discard, then the completing upload writes the discarded edit back via
    // onSave. The save timeout guarantees this lock is released.
    if (isSaving) return
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
    // Nothing to persist (untouched, or reverted back to the original) — just
    // close without re-baking/uploading.
    if (!isModified || !draft) {
      onClose()
      return
    }

    // A previous save is still actually running in the background (it timed
    // out from the UI's perspective, but the upload itself can't be
    // cancelled) -- don't start a second, concurrent one.
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

  // A locked-ratio crop can only be (re)computed once the real image aspect is
  // known — without it, defaultCropRect/resizeRectByHandle would assume a
  // square (1:1) image and bake the wrong pixel ratio. Reset, Rotate, AND
  // dragging a handle in CropFocalControl all re-derive/depend on the locked
  // crop, so all three are blocked until the image loads (a free crop ignores
  // imageAspect, and flips just mirror the existing rect, so neither needs
  // this guard).
  const isLockedRatioAspectPending =
    lockedRatio != null && imageAspect === undefined

  // Reset does NOT save or close, same as any other edit, so the editor can see
  // the reset in the preview and still Save/Undo/Cancel from there.
  const isResetDisabled = isLockedRatioAspectPending

  const handleReset = () => {
    setDraft((d) => ({
      ...ensureAdjustment(d),
      crop: defaultCropRect(lockedRatio, imageAspect ?? 1),
      focal: { x: 0.5, y: 0.5 },
      rotate: 0,
      flipH: false,
      flipV: false,
    }))
  }

  // Rotating/flipping moves the crop + focal with the image content so they
  // keep framing the same subject. The stored rotate value is resolved via
  // nextRotation (a single flip reverses the displayed rotation sense); the
  // crop/focal always move in the COMMANDED display direction. A quarter turn
  // inverts the aspect, which would break a locked ratio's fixed output shape —
  // so for locked-ratio components re-fit the crop to a valid centered rect in
  // the new orientation instead of rotating it geometrically. (Disabled until
  // imageAspect loads for locked ratios — see isLockedRatioAspectPending — so a
  // square-assumed crop can never be baked.)
  const handleRotate = (direction: "cw" | "ccw") => {
    // Defence in depth: the rotate buttons are already disabled in this state,
    // but never re-derive a locked crop against a square-assumed aspect.
    if (isLockedRatioAspectPending) return
    setDraft((d) => {
      const base = ensureAdjustment(d)
      const rotate = nextRotation(base, direction)
      if (lockedRatio) {
        const quarter = rotate === 90 || rotate === 270
        const displayAspect = quarter
          ? 1 / (imageAspect ?? 1)
          : (imageAspect ?? 1)
        return {
          ...base,
          rotate,
          crop: defaultCropRect(lockedRatio, displayAspect),
          focal: { x: 0.5, y: 0.5 },
        }
      }
      return {
        ...base,
        rotate,
        crop:
          direction === "cw"
            ? rotateRectCw(base.crop)
            : rotateRectCcw(base.crop),
        focal:
          direction === "cw"
            ? rotatePointCw(base.focal)
            : rotatePointCcw(base.focal),
      }
    })
  }

  const handleFlip = (axis: "h" | "v") => {
    setDraft((d) => {
      const base = ensureAdjustment(d)
      return axis === "h"
        ? {
            ...base,
            flipH: !base.flipH,
            crop: flipRectH(base.crop),
            focal: flipPointH(base.focal),
          }
        : {
            ...base,
            flipV: !base.flipV,
            crop: flipRectV(base.crop),
            focal: flipPointV(base.focal),
          }
    })
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
              {/* Canvas Area: Live Breakpoint Preview */}
              <GridItem>
                <AdjustmentPreview
                  src={src}
                  originalSrc={originalSrc}
                  adjustment={draft}
                  previewStates={config.previewStates}
                  scrim={config.scrim}
                  block={block}
                  imageFieldName={imageFieldName}
                  skipRealComponentPreview={config.skipRealComponentPreview}
                  stackPreviews={config.stackPreviews}
                  objectFit={previewObjectFit}
                  siteId={siteId}
                />
              </GridItem>

              {/* Controls Panel */}
              <GridItem>
                <VStack align="start" spacing="1.5rem" w="100%">
                  {/* Crop + focal point: one shared image canvas, since focal
                      is only meaningful relative to the crop. */}
                  {(config.cropMode !== "none" || focalEnabled) && (
                    <CropFocalControl
                      src={originalSrc}
                      crop={draft?.crop}
                      focal={draft?.focal}
                      cropMode={config.cropMode}
                      lockedRatio={lockedRatio}
                      focalEnabled={focalEnabled}
                      rotate={draft?.rotate ?? 0}
                      flipH={draft?.flipH ?? false}
                      flipV={draft?.flipV ?? false}
                      onCropChange={(crop) =>
                        setDraft((d) => ({ ...ensureAdjustment(d), crop }))
                      }
                      onFocalChange={(focal) =>
                        setDraft((d) => ({ ...ensureAdjustment(d), focal }))
                      }
                      onImageAspectChange={setImageAspect}
                      onNaturalSizeChange={setNaturalSize}
                      isDisabled={isSaving || isLockedRatioAspectPending}
                    />
                  )}

                  {/* Rotate & flip — applies to every adjustable component. */}
                  <TransformControl
                    flipH={draft?.flipH ?? false}
                    flipV={draft?.flipV ?? false}
                    rotateDisabled={isLockedRatioAspectPending}
                    onRotate={handleRotate}
                    onFlip={handleFlip}
                  />

                  {/* Low-resolution warning — the kept crop can't fill this
                      component's largest frame even at 1x, so it would look soft. */}
                  {lowResWarning && (
                    <Infobox variant="warning" size="sm">
                      <Text textStyle="body-2">
                        This image may look blurry here. The area you've kept is
                        about {lowResWarning.effectiveWidth}px wide, but it can
                        display up to {lowResWarning.targetWidth}px wide. Use a
                        larger image, or keep a wider area in the crop.
                      </Text>
                    </Infobox>
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
                isDisabled={isResetDisabled || isSaving}
              >
                Reset adjustments
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

import type {
  ImageAdjustment,
  IsomerComponent,
  IsomerPageLayoutType,
} from "@opengovsg/isomer-components"
import type { RefObject } from "react"
import {
  Box,
  ButtonGroup,
  Flex,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import {
  Button,
  Infobox,
  ModalCloseButton,
  useToast,
} from "@opengovsg/design-system-react"
import { isFocalApplicable } from "@opengovsg/isomer-components"
import posthog from "posthog-js"
import { useEffect, useMemo, useRef, useState } from "react"
import { BiInfoCircle, BiReset } from "react-icons/bi"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { DiscardChangesModal } from "../DiscardChangesModal/DiscardChangesModal"
import { ensureAdjustment } from "./adjustmentDraft"
import { AdjustmentPreview } from "./AdjustmentPreview"
import { CropFocalControl } from "./controls/CropFocalControl"
import { defaultCropRect } from "./controls/cropGeometry"
import {
  focalToWholeImagePoint,
  pointToCropRelativeFocal,
} from "./controls/focalGeometry"
import { computeLowResWarning } from "./resolutionWarning"
import {
  resolveOriginalKey,
  useSaveImageAdjustment,
} from "./useSaveImageAdjustment"

const SCROLLBAR_SIZE = "0.5rem"

// An always-visible scrollbar drawn over `scrollRef`'s gutter. macOS hides
// native overlay scrollbars when idle, and CSS cannot stop it.
const PersistentScrollbar = ({
  scrollRef,
}: {
  scrollRef: RefObject<HTMLDivElement>
}) => {
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(
    null,
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight <= clientHeight) {
        setThumb(null)
        return
      }
      const height = Math.max((clientHeight / scrollHeight) * clientHeight, 24)
      const maxTop = clientHeight - height
      const top = (scrollTop / (scrollHeight - clientHeight)) * maxTop || 0
      setThumb({ top, height })
    }

    update()
    el.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    // Tiles loading change the content height without resizing `el`.
    Array.from(el.children).forEach((child) => observer.observe(child))

    return () => {
      el.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [scrollRef])

  return (
    <Box
      display={{ base: "none", md: "block" }}
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      w={SCROLLBAR_SIZE}
      bg="gray.100"
      borderRadius="full"
      pointerEvents="none"
      aria-hidden
    >
      {thumb && (
        <Box
          position="absolute"
          left={0}
          right={0}
          top={`${thumb.top}px`}
          h={`${thumb.height}px`}
          bg="gray.400"
          borderRadius="full"
        />
      )}
    </Box>
  )
}

interface ImageAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  config: AdjustmentConfig
  src: string
  value?: ImageAdjustment
  // The block and its image field, so the preview renders the real component.
  block: IsomerComponent | undefined
  imageFieldName: string
  // The object that holds the field, such as one InfoCards card.
  fieldHost: Record<string, unknown> | undefined
  // The just-uploaded original, kept in the browser. The canvas, preview and
  // save bake from it while the malware scan still blocks the uploaded copy.
  originalFile?: File
  // The page's layout. Some components, such as Blockquote, change shape by it.
  pageLayout?: IsomerPageLayoutType
  siteId: number
  resourceId?: string
  // Set this to show the fit control, for components with an imageFit.
  initialImageFit?: "cover" | "contain"
  onSave: (result: {
    src: string
    imageAdjustment: ImageAdjustment | undefined
    imageFit?: "cover" | "contain"
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
  originalFile,
  pageLayout,
  value,
  siteId,
  resourceId,
  initialImageFit,
  onSave,
}: ImageAdjustmentModalProps): JSX.Element => {
  const localOriginalUrl = useMemo(
    () => (originalFile ? URL.createObjectURL(originalFile) : undefined),
    [originalFile],
  )
  useEffect(() => {
    return () => {
      if (localOriginalUrl) URL.revokeObjectURL(localOriginalUrl)
    }
  }, [localOriginalUrl])
  // The unsaved fit choice drives the preview and focal. `fieldHost` still
  // holds the saved one.
  const hasImageFitControl = initialImageFit !== undefined
  const [imageFit, setImageFit] = useState<"cover" | "contain">(
    initialImageFit ?? "cover",
  )
  const focalEnabled =
    config.focalEnabled && (!hasImageFitControl || isFocalApplicable(imageFit))
  const previewObjectFit = hasImageFitControl
    ? imageFit === "contain"
      ? "contain"
      : "cover"
    : (config.previewObjectFitFor?.(fieldHost) ?? "cover")
  const [draft, setDraft] = useState<ImageAdjustment | undefined>(value)
  // Undefined until CropFocalControl loads the image.
  const [imageAspect, setImageAspect] = useState<number | undefined>(undefined)
  const [naturalSize, setNaturalSize] = useState<
    { width: number; height: number } | undefined
  >(undefined)
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const toast = useToast()
  const saveMutation = useSaveImageAdjustment({
    siteId,
    resourceId,
  })
  // Track each tool once per modal session, not once per drag.
  const trackedToolsRef = useRef(new Set<string>())
  const previewRailRef = useRef<HTMLDivElement>(null)
  const trackToolUsed = (tool: "crop" | "focal") => {
    if (trackedToolsRef.current.has(tool)) return
    trackedToolsRef.current.add(tool)
    posthog.capture("image_adjustment_tool_used", {
      site_id: siteId,
      resource_id: resourceId,
      tool,
    })
  }
  // The hook bounds the real save to SAVE_TIMEOUT_MS itself, so isPending is
  // the single source of truth -- no separate local flag needed.
  const isSaving = saveMutation.isPending

  const isModified =
    JSON.stringify(draft) !== JSON.stringify(value) ||
    (hasImageFitControl && imageFit !== (initialImageFit ?? "cover"))

  const lockedRatio =
    config.cropMode === "fixed" ? config.lockedRatios?.[0] : undefined

  const lowResWarning = useMemo(
    () =>
      computeLowResWarning({
        naturalSize,
        crop: draft?.crop,
        lockedRatio,
        maxRenderedWidthPx: config.maxRenderedWidthPx,
        maxRenderedHeightPx: config.maxRenderedHeightPx,
        objectFit: previewObjectFit,
      }),
    [
      naturalSize,
      config.maxRenderedWidthPx,
      config.maxRenderedHeightPx,
      previewObjectFit,
      draft?.crop,
      lockedRatio,
    ],
  )

  // Edit and bake from the original, never a previous bake, so re-encode loss
  // does not compound. On a re-edit `src` is the previous bake.
  const originalSrc = `/${resolveOriginalKey(src, draft ?? {})}`

  const handleClose = () => {
    // Block dismissal mid-save — otherwise a discard followed by the completing
    // upload would write the discarded edit back via onSave.
    if (isSaving) return
    if (isModified) {
      onDiscardChangesModalOpen()
    } else {
      onClose()
    }
  }

  const handleDiscard = () => {
    setDraft(value)
    setImageFit(initialImageFit ?? "cover")
    onDiscardChangesModalClose()
  }

  const handleSave = async () => {
    if (!isModified) {
      onClose()
      return
    }
    // Only imageFit changed, so there is nothing to bake.
    if (!draft) {
      onSave({
        src,
        imageAdjustment: value,
        imageFit: hasImageFitControl ? imageFit : undefined,
      })
      onClose()
      return
    }

    // A previous save is still genuinely in flight — don't start a second one.
    if (saveMutation.isPending) {
      toast({
        title: "Still saving the previous change",
        description: "Please wait for it to finish before saving again.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      const result = await saveMutation.mutateAsync({
        currentSrc: src,
        draft,
        originalFile,
      })
      posthog.capture("image_adjustment_saved", {
        site_id: siteId,
        resource_id: resourceId,
      })
      onSave({
        ...result,
        imageFit: hasImageFitControl ? imageFit : undefined,
      })
      onClose()
    } catch (err) {
      toast({
        title: "Failed to save image adjustment",
        description: err instanceof Error ? err.message : "An error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // A locked crop computed before the image loads assumes a square image and
  // bakes the wrong ratio. Block reset and handle drags until then.
  const isLockedRatioAspectPending =
    lockedRatio != null && imageAspect === undefined

  const isResetDisabled = isLockedRatioAspectPending

  const handleReset = () => {
    setDraft((d) => ({
      ...ensureAdjustment(d),
      crop: defaultCropRect(lockedRatio, imageAspect ?? 1),
      focal: { x: 0.5, y: 0.5 },
    }))
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
        isCentered
        // Outer scrolling on a centered modal cuts off the top of tall content.
        scrollBehavior="inside"
        isOpen={isOpen}
        onClose={handleClose}
        closeOnOverlayClick={!isSaving}
        closeOnEsc={!isSaving}
      >
        <ModalOverlay />
        <ModalContent
          overflow="hidden"
          maxW={{ md: "75rem" }}
          // Fixed height, so edits never resize or move the modal. minH is
          // needed too, to override the maxH from `scrollBehavior="inside"`.
          h={{ md: "min(50rem, 90vh)" }}
          minH={{ md: "min(50rem, 90vh)" }}
        >
          <ModalHeader pr="4.5rem">
            <Text as="span" textStyle="h4" fontWeight="semibold">
              Edit image
            </Text>
          </ModalHeader>

          <ModalCloseButton
            size="lg"
            onClick={handleClose}
            isDisabled={isSaving}
          />

          {/* On desktop each column scrolls. On mobile the body scrolls. */}
          <ModalBody
            p="2rem"
            flex="1"
            minH={0}
            overflow={{ base: "auto", md: "hidden" }}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              gap="1.5rem"
              align="stretch"
              w="100%"
              h={{ md: "100%" }}
              minH={0}
            >
              {/* Crop column. The canvas fills the height left on desktop and
                  has a fixed height on mobile. */}
              <Flex
                direction="column"
                gap="1.125rem"
                flex={{ md: "1" }}
                minW={0}
                w="100%"
                minH={{ md: 0 }}
                overflowY={{ md: "auto" }}
                // A scrollbar that changes the width starts a resize loop
                // with the preview tiles.
                sx={{ scrollbarGutter: "stable" }}
              >
                {(config.cropMode !== "none" || focalEnabled) && (
                  <Box
                    h={{ base: "18rem", md: "auto" }}
                    flex={{ md: "1" }}
                    minH={{ md: "14rem" }}
                  >
                    <CropFocalControl
                      src={localOriginalUrl ?? originalSrc}
                      crop={draft?.crop}
                      focal={draft?.focal}
                      cropMode={config.cropMode}
                      lockedRatio={lockedRatio}
                      focalEnabled={focalEnabled}
                      isOpen={isOpen}
                      onCropChange={(crop) => {
                        trackToolUsed("crop")
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
                      }}
                      onFocalChange={(focal) => {
                        trackToolUsed("focal")
                        setDraft((d) => ({ ...ensureAdjustment(d), focal }))
                      }}
                      onImageAspectChange={setImageAspect}
                      onNaturalSizeChange={setNaturalSize}
                      isDisabled={isSaving || isLockedRatioAspectPending}
                    />
                  </Box>
                )}

                {hasImageFitControl && (
                  <HStack flexShrink={0} spacing="0.75rem">
                    <Text textStyle="subhead-2">Image fit</Text>
                    <ButtonGroup isAttached size="xs" aria-label="Image fit">
                      <Button
                        variant={imageFit === "cover" ? "solid" : "outline"}
                        aria-pressed={imageFit === "cover"}
                        isDisabled={isSaving}
                        onClick={() => setImageFit("cover")}
                      >
                        Fill
                      </Button>
                      <Button
                        variant={imageFit === "contain" ? "solid" : "outline"}
                        aria-pressed={imageFit === "contain"}
                        isDisabled={isSaving}
                        onClick={() => setImageFit("contain")}
                      >
                        Fit
                      </Button>
                    </ButtonGroup>
                  </HStack>
                )}

                {config.cropMode === "none" && (
                  <Box
                    w="100%"
                    flexShrink={0}
                    p="1rem"
                    bgColor="utility.ui"
                    borderRadius="0.25rem"
                    borderWidth="1px"
                    borderColor="base.divider.medium"
                  >
                    <Text textStyle="body-2">
                      This image cannot be cropped. Only focal point adjustments
                      are available.
                    </Text>
                  </Box>
                )}
              </Flex>

              {/* Preview rail. The Box anchors PersistentScrollbar. */}
              <Box
                position="relative"
                w={{ base: "100%", md: "21rem" }}
                flexShrink={0}
                minH={0}
                h={{ md: "100%" }}
              >
                <VStack
                  ref={previewRailRef}
                  align="stretch"
                  spacing="1rem"
                  w="100%"
                  h="100%"
                  // Room for PersistentScrollbar's track, plus a gap.
                  pr={{ md: `calc(${SCROLLBAR_SIZE} + 0.5rem)` }}
                  overflowY={{ base: "visible", md: "scroll" }}
                  // PersistentScrollbar replaces the native scrollbar.
                  sx={{
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  {/* Sticky, with an opaque bg so tiles scroll behind it. */}
                  <VStack
                    align="stretch"
                    spacing="0.4rem"
                    position={{ md: "sticky" }}
                    top={0}
                    zIndex={1}
                    bg="base.canvas.default"
                    pb="0.25rem"
                  >
                    <HStack spacing="0.25rem">
                      <Text textStyle="subhead-1">Preview</Text>
                      <Tooltip
                        label="Previews show common phone, tablet and desktop sizes. Your screen may show a slightly different layout."
                        placement="top"
                        hasArrow
                      >
                        <Box
                          as="span"
                          display="inline-flex"
                          color="base.content.medium"
                          aria-label="About previews"
                        >
                          <Icon as={BiInfoCircle} />
                        </Box>
                      </Tooltip>
                    </HStack>
                  </VStack>

                  {lowResWarning && (
                    <Infobox variant="warning" size="sm">
                      <Text textStyle="body-2">
                        This image may look blurry here. The area you've kept is
                        about {lowResWarning.effectivePx}px{" "}
                        {lowResWarning.dimension === "width" ? "wide" : "tall"},
                        but it can display up to {lowResWarning.targetPx}
                        px{" "}
                        {lowResWarning.dimension === "width" ? "wide" : "tall"}.
                        Use a larger image, or keep a{" "}
                        {lowResWarning.dimension === "width"
                          ? "wider"
                          : "taller"}{" "}
                        area in the crop.
                      </Text>
                    </Infobox>
                  )}

                  <AdjustmentPreview
                    src={src}
                    originalSrc={originalSrc}
                    originalFile={originalFile}
                    adjustment={draft}
                    previewStates={config.previewStates}
                    block={block}
                    imageFieldName={imageFieldName}
                    fieldHost={fieldHost}
                    buildSingleItemPreviewBlock={
                      config.buildSingleItemPreviewBlock
                    }
                    skipRealComponentPreview={config.skipRealComponentPreview}
                    objectFit={previewObjectFit}
                    pageLayout={pageLayout}
                    siteId={siteId}
                  />
                </VStack>
                <PersistentScrollbar scrollRef={previewRailRef} />
              </Box>
            </Flex>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="base.divider.medium">
            <HStack spacing="1rem" w="100%">
              <Button
                variant="outline"
                colorScheme="critical"
                leftIcon={<BiReset />}
                onClick={handleReset}
                isDisabled={isResetDisabled || isSaving}
              >
                Reset image
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
                Save changes
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

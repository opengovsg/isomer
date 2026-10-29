import type { ImageAdjustment } from "@opengovsg/isomer-components"
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
  Select,
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
import posthog from "posthog-js"
import { useEffect, useMemo, useRef, useState } from "react"
import { BiInfoCircle, BiReset } from "react-icons/bi"

import type { AdjustmentConfig } from "./AdjustmentConfig"
import { DiscardChangesModal } from "../DiscardChangesModal/DiscardChangesModal"
import { ensureAdjustment } from "./adjustmentDraft"
import { AdjustmentPreview } from "./AdjustmentPreview"
import { CropFocalControl } from "./controls/CropFocalControl"
import { defaultCropRect } from "./controls/cropGeometry"
import { computeLowResWarning } from "./resolutionWarning"
import {
  resolveOriginalKey,
  useSaveImageAdjustment,
} from "./useSaveImageAdjustment"

// Upper bound on how long we wait for a save (bake → presign → upload) before
// surfacing an error and unlocking the modal, so a hung network request can't
// trap the editor in a permanently disabled modal.
const SAVE_TIMEOUT_MS = 30_000

// Width of the custom scrollbar track rendered over the preview rail.
const SCROLLBAR_SIZE = "0.5rem"

// A permanently-visible scrollbar track + thumb, overlaid on the reserved
// gutter of `scrollRef`'s element. Native scrollbars can't be forced to stay
// visible across browsers — macOS renders overlay scrollbars that auto-hide
// whenever the user isn't actively scrolling, even with `overflow-y: scroll`
// and `::-webkit-scrollbar` styling (OS-level compositing, not CSS-reachable).
// This component reads the element's own scroll state instead, so the track
// is always drawn and the thumb always reflects real scroll position/size.
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
      // No overflow — nothing to show a thumb for (track still renders).
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
    // The rail's content height can change without the element itself
    // resizing (e.g. tiles loading), so also watch its children.
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
  // The real block content + the name of the field holding the image, so the
  // preview can render the actual published component (real copy, scrim,
  // crop frame) rather than an approximation.
  block: unknown
  imageFieldName: string
  // The field's immediate host (for an array-nested InfoCards image, the card
  // object) — read by the config's focalEnabledFor/previewObjectFitFor to resolve
  // the controls for this card's current imageFit.
  fieldHost: unknown
  // The retained client-side bytes of the just-uploaded original, when available
  // (see JsonFormsImageControl). Lets the crop canvas, preview, and save bake
  // from local bytes while the uploaded original is still gated by the scan
  // window. Kept client-side only — never sent to the Studio server.
  originalFile?: File
  siteId: number
  resourceId?: string
  // When provided, this component owns an imageFit (e.g. InfoCards) and the
  // fit control + its live preview/focal derivation are enabled.
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
  value,
  siteId,
  resourceId,
  initialImageFit,
  onSave,
}: ImageAdjustmentModalProps): JSX.Element => {
  // One object URL for the retained local original, shared by the crop canvas.
  // Revoked on unmount / when the file changes. The modal remounts per image
  // (key={data}), so originalFile is stable within a mount.
  const localOriginalUrl = useMemo(
    () => (originalFile ? URL.createObjectURL(originalFile) : undefined),
    [originalFile],
  )
  useEffect(() => {
    return () => {
      if (localOriginalUrl) URL.revokeObjectURL(localOriginalUrl)
    }
  }, [localOriginalUrl])
  // When this modal owns an imageFit (InfoCards), the fit control shown below
  // drives the live preview/focal directly from local state, instead of the
  // stale fieldHost-derived config (the control hasn't been saved yet).
  const hasImageFitControl = initialImageFit !== undefined
  const [imageFit, setImageFit] = useState<"cover" | "contain">(
    initialImageFit ?? "cover",
  )
  // Tier C (InfoCards): focal and the preview's object-fit depend on the card's
  // current imageFit; other components have no resolver and fall back to the
  // static config / cover.
  const focalEnabled = hasImageFitControl
    ? imageFit !== "contain"
    : config.focalEnabledFor
      ? config.focalEnabledFor(fieldHost)
      : config.focalEnabled
  const previewObjectFit = hasImageFitControl
    ? imageFit === "contain"
      ? "contain"
      : "cover"
    : (config.previewObjectFitFor?.(fieldHost) ?? "cover")
  const [draft, setDraft] = useState<ImageAdjustment | undefined>(value)
  // Which of config.versions' preview sets the rail currently shows. Defaults
  // to the first; only surfaced as a dropdown when there's more than one
  // version (e.g. Blockquote shown with no page-layout context, so both
  // circle and square are candidates). Reset whenever the config identity
  // changes (e.g. re-resolved for a different block) so a stale version id
  // from a previous image can't silently select nothing.
  const [activeVersionId, setActiveVersionId] = useState(
    () => config.versions[0]?.id,
  )
  useEffect(() => {
    setActiveVersionId(config.versions[0]?.id)
  }, [config])
  const activeVersion =
    config.versions.find((v) => v.id === activeVersionId) ?? config.versions[0]
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
  // Fires once per tool per modal session (not once per drag/keystroke) --
  // adoption only cares whether a tool was touched at all while editing.
  const trackedToolsRef = useRef(new Set<string>())
  // Scroll container for the preview rail — read by PersistentScrollbar so
  // its track/thumb overlay reflects this element's real scroll state.
  const previewRailRef = useRef<HTMLDivElement>(null)
  const trackToolUsed = (tool: "crop" | "focal" | "rotate" | "flip") => {
    if (trackedToolsRef.current.has(tool)) return
    trackedToolsRef.current.add(tool)
    posthog.capture("image_adjustment_tool_used", {
      site_id: siteId,
      resource_id: resourceId,
      tool,
    })
  }
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

  // Check if draft (or, when shown, imageFit) differs from its original value.
  const isModified =
    JSON.stringify(draft) !== JSON.stringify(value) ||
    (hasImageFitControl && imageFit !== (initialImageFit ?? "cover"))

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
        maxRenderedHeightPx: config.maxRenderedHeightPx,
        objectFit: previewObjectFit,
      }),
    [
      naturalSize,
      config.maxRenderedWidthPx,
      config.maxRenderedHeightPx,
      previewObjectFit,
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
    if (!isModified) {
      onClose()
      return
    }
    // Only imageFit changed (crop/focal untouched) — nothing to bake, so skip
    // straight to onSave instead of invoking save() with an empty draft.
    if (!draft) {
      onSave({ src, imageAdjustment: value, imageFit })
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
    const savePromise = save(src, draft, originalFile)
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
      posthog.capture("image_adjustment_saved", {
        site_id: siteId,
        resource_id: resourceId,
      })
      onSave({ ...result, imageFit })
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
  // square (1:1) image and bake the wrong pixel ratio. Reset AND dragging a
  // handle in CropFocalControl both re-derive/depend on the locked crop, so
  // both are blocked until the image loads (a free crop ignores imageAspect,
  // so it's never blocked by this).
  const isLockedRatioAspectPending =
    lockedRatio != null && imageAspect === undefined

  // Reset does NOT save or close, same as any other edit, so the editor can see
  // the reset in the preview and still Save/Cancel from there.
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
        // Scroll INSIDE the body, not the (centered) outer container — otherwise
        // when content is taller than the viewport, centering offsets the top
        // above the scroll origin and it can't be reached (the editor gets cut
        // off with the scrollbar already at its max).
        scrollBehavior="inside"
        isOpen={isOpen}
        onClose={handleClose}
        closeOnOverlayClick={!isSaving}
        closeOnEsc={!isSaving}
      >
        <ModalOverlay />
        {/* Fixed height so edits inside never resize (and thus reposition) the
            modal — the preview rail scrolls internally instead. */}
        <ModalContent
          overflow="hidden"
          maxW={{ md: "75rem" }}
          // Give the dialog a real, generous height. `scrollBehavior="inside"`
          // only sets a maxH (calc(100% - 7.5rem)) and no height, so without an
          // explicit floor the centered dialog collapses toward its content. minH
          // overrides that cap to lock a stable height; it scales with the
          // viewport but is capped so it isn't tiny on short screens or huge on
          // tall ones. Both are the same value → a fixed height that never jumps.
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

          {/* On desktop the body fills the fixed height and does NOT scroll as
              a whole; each column scrolls on its own (see below). On mobile
              (stacked), fall back to normal body scroll. */}
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
              {/* Crop column. On desktop the canvas flex-fills the fixed body
                  height with the toolbar pinned below, so the editor fits without
                  scrolling regardless of the image's shape (it's letterboxed
                  inside a fixed canvas); if the viewport is too short to fit even
                  the minimum editor, the column scrolls as a fallback. When
                  stacked (narrow viewport) the canvas takes a fixed height and
                  the whole body scrolls. */}
              <Flex
                direction="column"
                gap="1.125rem"
                flex={{ md: "1" }}
                minW={0}
                w="100%"
                minH={{ md: 0 }}
                overflowY={{ md: "auto" }}
                // Reserve the scrollbar gutter so toggling it never changes the
                // content width (prevents a resize feedback loop with the tiles).
                sx={{ scrollbarGutter: "stable" }}
              >
                {/* Crop + focal point: one shared image canvas, since focal
                    is only meaningful relative to the crop. */}
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
                      rotate={draft?.rotate ?? 0}
                      flipH={draft?.flipH ?? false}
                      flipV={draft?.flipV ?? false}
                      onCropChange={(crop) => {
                        trackToolUsed("crop")
                        setDraft((d) => ({ ...ensureAdjustment(d), crop }))
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

                {/* Image fit — only for components (e.g. InfoCards) whose
                    layout lets the image either cover (Fill) or letterbox (Fit)
                    its frame. Inline segmented toggle to keep the UI compact. */}
                {hasImageFitControl && (
                  <HStack flexShrink={0} spacing="0.75rem">
                    <Text textStyle="subhead-2">Image fit</Text>
                    <ButtonGroup isAttached size="xs" aria-label="Image fit">
                      <Button
                        variant={imageFit === "cover" ? "solid" : "outline"}
                        aria-pressed={imageFit === "cover"}
                        onClick={() => setImageFit("cover")}
                      >
                        Fill
                      </Button>
                      <Button
                        variant={imageFit === "contain" ? "solid" : "outline"}
                        aria-pressed={imageFit === "contain"}
                        onClick={() => setImageFit("contain")}
                      >
                        Fit
                      </Button>
                    </ButtonGroup>
                  </HStack>
                )}

                {/* Preserve-only note */}
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
                      This image cannot be cropped. Only focal point and
                      rotation adjustments are available.
                    </Text>
                  </Box>
                )}
              </Flex>

              {/* Preview rail — scrolls within the fixed modal height, so a
                  taller/shorter preview (from a different crop) never resizes
                  the modal. Wrapped in a relative Box so PersistentScrollbar
                  can overlay a permanently-visible track on the gutter. */}
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
                  // Reserve space for PersistentScrollbar's track so content
                  // never runs under it, and so the width never changes when
                  // the thumb appears/disappears (avoids a resize loop, since
                  // tile heights are derived from this width).
                  pr={{ md: SCROLLBAR_SIZE }}
                  overflowY={{ base: "visible", md: "scroll" }}
                  // Hide the native scrollbar — PersistentScrollbar replaces
                  // it with a track that's always visible, which native
                  // scrollbars can't guarantee (macOS auto-hides overlay
                  // scrollbars regardless of overflow/pseudo-element CSS).
                  sx={{
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                  }}
                >
                  {/* Pinned so it stays visible while the tiles scroll. Opaque bg
                      + zIndex so scrolling previews pass behind it. */}
                  <HStack
                    spacing="0.25rem"
                    position={{ md: "sticky" }}
                    top={0}
                    zIndex={1}
                    bg="base.canvas.default"
                    pb="0.25rem"
                    justify="space-between"
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

                    {/* Only shown when the config declares more than one
                        preview version (e.g. Blockquote's circle/square masks
                        with no page-layout context to narrow to one). */}
                    {config.versions.length > 1 && (
                      <Select
                        size="xs"
                        w="auto"
                        aria-label="Preview version"
                        value={activeVersionId}
                        onChange={(e) => setActiveVersionId(e.target.value)}
                      >
                        {config.versions.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label ?? "Preview"}
                          </option>
                        ))}
                      </Select>
                    )}
                  </HStack>

                  {/* Low-resolution warning — the kept crop can't fill this
                      component's largest frame even at 1x, so it would look soft. */}
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
                    previewStates={activeVersion?.previewStates ?? []}
                    scrim={config.scrim}
                    // The card's title, overlaid on the gradient in the full-image
                    // card preview (only drawn when the config has a scrim).
                    scrimText={(fieldHost as { title?: string } | null)?.title}
                    block={block}
                    imageFieldName={imageFieldName}
                    fieldHost={fieldHost}
                    buildSingleItemPreviewBlock={
                      config.buildSingleItemPreviewBlock
                    }
                    skipRealComponentPreview={config.skipRealComponentPreview}
                    stackPreviews={config.stackPreviews}
                    objectFit={previewObjectFit}
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

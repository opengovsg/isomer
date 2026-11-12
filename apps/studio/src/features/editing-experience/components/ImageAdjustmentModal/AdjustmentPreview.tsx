"use client"

import type {
  IsomerComponent,
  IsomerPageLayoutType,
  IsomerSiteProps,
  ImageAdjustment,
} from "@opengovsg/isomer-components"
import type { CSSProperties } from "react"
import type { IframeCallbackFnProps } from "~/types/dom"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import {
  getFocalObjectPosition,
  renderComponent,
} from "@opengovsg/isomer-components"
import { useCallback, useEffect, useRef, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useDebounceValue } from "usehooks-ts"
import Suspense from "~/components/Suspense"
import { PreviewIframe } from "~/features/editing-experience/components/preview/PreviewIframe"
import { useSiteThemeCssVars } from "~/hooks/useSiteThemeCssVars"
import { bakeImage, isAnimatedImageBlob } from "~/lib/imageBake"
import {
  ASSETS_BASE_URL,
  generateAssetUrl,
  generateOriginalAssetUrl,
} from "~/utils/generateAssetUrl"

import type {
  AdjustmentPreviewState,
  BuildSingleItemPreviewBlock,
} from "./AdjustmentConfig"
import { chooseBakeMime } from "./useSaveImageAdjustment"

// Minimal site stub for an ISOLATED single-block preview — there is no real
// page/nav/footer context here (this renders one block, not a whole page), so
// only the fields HeroGradient/Contentpic actually read (assetsBaseUrl,
// siteMapArray for reference-link resolution, which degrades gracefully to
// the raw link on a miss) are populated. Mirrors the same escape hatch
// PreviewWithCustomSitemap.tsx already uses for its own site prop.
const PREVIEW_SITE_STUB = {
  assetsBaseUrl: ASSETS_BASE_URL,
  siteMapArray: [],
} as unknown as IsomerSiteProps

// Gets the bytes to bake: the retained local original if we have it (no fetch;
// works while the uploaded original is still gated), else fetch -- ?original
// first, then the webp variant. CORS must be readable. Always the TRUE
// original, never a previous bake, so re-encode loss can't compound. On
// failure the preview falls back to the uncropped src and surfaces that via
// fetchError, since save would throw on the same failure.
const useOriginalImageBlob = (originalSrc: string, originalFile?: Blob) => {
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
  const [fetchError, setFetchError] = useState(false)

  // Bake from the pristine original (bypass the CDN transcode), matching the
  // save path — the transcoded variant can be downscaled or carry a generic
  // "binary/octet-stream" type that the bake gate rejects.
  const originalFetchUrl = generateOriginalAssetUrl(originalSrc)
  // Fallback when the ?original bypass is gated (e.g. 403): force the webp
  // variant (not avif) so baking can proceed — the baker only accepts
  // jpeg/png/webp, so a default */* (avif) fetch would be rejected downstream.
  const plainFetchUrl = generateAssetUrl(originalSrc)

  useEffect(() => {
    let cancelled = false
    if (originalFile) {
      setOriginalBlob(originalFile)
      return
    }
    const fetchOriginal = async () => {
      setFetchError(false)
      // Try ?original (pristine), then fall back to the plain variant — the same
      // URL the <img> display uses. The ?original object is gated by a
      // malware-scan tag and can 403; critically, that error response can also be
      // CORS-opaque, so the fetch *throws* rather than resolving with !ok. Each
      // attempt is therefore isolated so a thrown ?original never skips the plain
      // fallback (the earlier `let response = await fetch(...)` aborted the whole
      // bake on a throw, freezing the preview on the previous bake).
      const tryFetch = async (
        url: string,
        init?: RequestInit,
      ): Promise<Blob | null> => {
        try {
          const response = await fetch(url, init)
          return response.ok ? await response.blob() : null
        } catch {
          return null
        }
      }
      const blob =
        (await tryFetch(originalFetchUrl)) ??
        (plainFetchUrl !== originalFetchUrl
          ? await tryFetch(plainFetchUrl, { headers: { Accept: "image/webp" } })
          : null)
      if (!blob) {
        // Falls back to the uncropped src (CORS-blocked images, etc.); fetchError
        // surfaces that fallback since save would throw on the same failure.
        console.debug("Failed to fetch original image for preview bake")
        if (!cancelled) setFetchError(true)
      }
      if (!cancelled) setOriginalBlob(blob)
    }
    void fetchOriginal()
    return () => {
      cancelled = true
    }
  }, [originalFile, originalFetchUrl, plainFetchUrl])

  return { originalBlob, fetchError }
}

type CropRect = NonNullable<ImageAdjustment["crop"]>

// Bakes a debounced preview of `crop` against `originalBlob`, returning an
// object URL (or null while there's nothing baked yet / crop is unset).
// Debounced on crop alone (not the whole adjustment): focal is applied at
// render time as CSS object-position, so a focal-only drag shouldn't trigger
// a canvas re-encode.
const useBakedPreviewUrl = (
  originalBlob: Blob | null,
  crop: CropRect | undefined,
  originalSrc: string,
) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [debouncedCrop, setDebouncedCrop] = useDebounceValue(crop, 150)
  const prevPreviewUrlRef = useRef<string | null>(null)
  // Monotonic token so a superseded, still-running bake can detect it and drop
  // its result — debouncing only cancels a bake that hasn't started yet.
  const bakeRequestIdRef = useRef(0)

  useEffect(() => {
    setDebouncedCrop(crop)
  }, [crop, setDebouncedCrop])

  useEffect(() => {
    const requestId = ++bakeRequestIdRef.current
    const isStale = () => requestId !== bakeRequestIdRef.current

    if (!originalBlob || !debouncedCrop) {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
        prevPreviewUrlRef.current = null
      }
      setPreviewUrl(null)
      return
    }

    const runBake = async () => {
      try {
        // Resolve the bake MIME the same way the save path does: prefer the
        // fetched blob's Content-Type, but fall back to the key's extension when
        // that type is missing or generic. ?original can return 200 with a
        // generic "binary/octet-stream" (no network/console error), which a bare
        // canBakeImage(blob.type) gate would silently reject — freezing the
        // preview on the previous bake for a re-edit. chooseBakeMime throws for a
        // genuinely unbakeable format, which we treat as "fall back to uncropped".
        let mimeType: string
        try {
          mimeType = chooseBakeMime(
            originalBlob.type,
            originalSrc.replace(/^\//, ""),
          )
        } catch {
          return
        }

        // Animated WebP/APNG pass the MIME gate but would be flattened, so fall
        // back to the uncropped src rather than baking a single frame.
        if (await isAnimatedImageBlob(originalBlob)) {
          return
        }

        const bakedBlob = await bakeImage(
          originalBlob,
          { crop: debouncedCrop },
          { mimeType },
        )
        // A newer crop started while this bake ran — discard this result
        // so the older crop can't replace the newer preview.
        if (isStale()) {
          return
        }
        const bakeUrl = URL.createObjectURL(bakedBlob)
        // Revoke previous URL before setting new one
        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current)
        }
        prevPreviewUrlRef.current = bakeUrl
        setPreviewUrl(bakeUrl)
      } catch (error) {
        // On any failure (CORS taint, canvas issue, etc.): fall back to the
        // uncropped src. Clear the previous preview so a stale crop from an
        // earlier successful bake isn't left showing for this draft — unless a
        // newer bake has already superseded this one.
        console.debug("Failed to bake image", error)
        if (isStale()) {
          return
        }
        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current)
          prevPreviewUrlRef.current = null
        }
        setPreviewUrl(null)
      }
    }
    void runBake()
  }, [originalBlob, originalSrc, debouncedCrop])

  // Bumps bakeRequestIdRef so a bake still in flight at unmount sees isStale()
  // once it resolves, instead of creating (and leaking) a new object URL after
  // unmount.
  useEffect(() => {
    return () => {
      bakeRequestIdRef.current++
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
      }
    }
  }, [])

  return previewUrl
}

interface AdjustmentPreviewProps {
  src: string
  // The TRUE original's raw stored path (e.g. "/1/uuid/file.png"), resolved
  // once by the parent modal via resolveOriginalKey — the bake input must
  // always be the original, never a previous bake (RFC: re-encode loss must
  // not compound). On a first edit this equals `src`; on a re-edit, `src` is
  // the previous bake and only this points at the true original.
  originalSrc: string
  // The retained client-side original bytes, when the image was uploaded this
  // session. Baked from directly (no fetch) and shown as the uncropped display
  // fallback, so the preview works while the uploaded original is still gated by
  // the malware-scan window.
  originalFile?: Blob
  adjustment?: ImageAdjustment
  previewStates: AdjustmentPreviewState[]
  // The real block content + the field name holding the image, so the real
  // published component can be rendered (real copy/scrim/frame) instead of
  // the framed-<img> approximation below. Falls back to the approximation
  // when absent.
  block?: IsomerComponent
  imageFieldName?: string
  // The field's immediate host — for a root-level image field this equals
  // `block`; for an array-nested field (e.g. an InfoCards card) this is the
  // individual card object. When it differs from `block`, the real-component
  // render needs `buildSingleItemPreviewBlock` to splice just this one item
  // back into a synthetic single-item block (otherwise the real component
  // would render the whole block/every item) — see that prop's doc.
  fieldHost?: Record<string, unknown>
  // Builds the synthetic single-item block for an array-nested image field
  // (see AdjustmentConfig). Required (and used) only when `fieldHost` differs
  // from `block`; absent/undefined there falls back to the framed-image
  // approximation, same as `skipRealComponentPreview`.
  buildSingleItemPreviewBlock?: BuildSingleItemPreviewBlock
  // Opt out of the real-component render and always use the framed-image
  // approximation below. Set for array-nested image fields with no
  // buildSingleItemPreviewBlock (e.g. ImageGallery), where the real component
  // would render the whole block/all items instead of the single one being
  // edited.
  skipRealComponentPreview?: boolean
  // The object-fit the framed-image approximation uses (skipRealComponentPreview
  // path). "contain" letterboxes the whole (cropped) image to match a field
  // like InfoCards' "Resize image to fit"; defaults to "cover". Ignored on the
  // real-component path, which renders the component's own fit.
  objectFit?: "cover" | "contain"
  // The real page layout the published page would render at — threaded
  // through so a layout-dependent shape previews correctly instead of always
  // defaulting to "content".
  pageLayout?: IsomerPageLayoutType
  // Needed to pull the site's brand theme CSS vars into the preview iframe —
  // without them, classes like `bg-brand-canvas-inverse` resolve to nothing.
  siteId: number
}

// Gap (px) between the two small tiles in the rail's second row.
const TILE_GAP_PX = 12
// The rail's design width (Figma) — used as the pre-measure default so tiles
// render at the right size on first paint, before the ResizeObserver reports.
const DEFAULT_RAIL_WIDTH_PX = 336

export const AdjustmentPreview = ({
  src,
  originalSrc,
  originalFile,
  adjustment,
  previewStates,
  block,
  imageFieldName,
  fieldHost,
  buildSingleItemPreviewBlock,
  skipRealComponentPreview,
  objectFit = "cover",
  pageLayout,
  siteId,
}: AdjustmentPreviewProps): JSX.Element => {
  // The preview tiles are sized relative to the rail's own width: the widest
  // state fills the rail on its own row, the rest sit two-up below it.
  const railRef = useRef<HTMLDivElement>(null)
  const [railWidth, setRailWidth] = useState(DEFAULT_RAIL_WIDTH_PX)
  useEffect(() => {
    const el = railRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setRailWidth(w)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const smallTileWidth = Math.floor((railWidth - TILE_GAP_PX) / 2)

  // Object URL for the retained local original (when the image was uploaded this
  // session), used as the uncropped display fallback — avoids a 404 before the
  // first bake for a fresh upload whose CDN variant hasn't propagated yet.
  const [localOriginalUrl, setLocalOriginalUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!originalFile) {
      setLocalOriginalUrl(null)
      return
    }
    const url = URL.createObjectURL(originalFile)
    setLocalOriginalUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [originalFile])

  // src arrives as the raw stored path (e.g. "/1/uuid/file.png"); resolve it to
  // the asset domain for DISPLAY (the fallback shown before any bake exists),
  // same as ImageClient does at render time. Prefer the local original when we
  // have it.
  const displaySrc = localOriginalUrl ?? generateAssetUrl(src)

  const { originalBlob, fetchError } = useOriginalImageBlob(
    originalSrc,
    originalFile,
  )
  const previewUrl = useBakedPreviewUrl(
    originalBlob,
    adjustment?.crop,
    originalSrc,
  )

  const adjustedSrc = previewUrl ?? displaySrc

  // Real-component preview: render the actual published block (real copy,
  // scrim, frame behaviour) with the adjusted image + draft imageAdjustment
  // spliced in, instead of the framed-<img> approximation below. Rendered at
  // the page's own layout, so a layout-dependent shape (e.g. Blockquote's
  // circle vs square) matches what this page will publish.
  const renderPreviewComponent = (): React.ReactNode => {
    if (!block || !fieldHost || !imageFieldName) return null
    // The image + alt fallback below apply to the field HOST: the block itself
    // for a root-level field, the card for an array-nested one (e.g. InfoCards).
    const isNestedField = fieldHost !== block
    // Preview-only safety net: some components (e.g. Blockquote) gate
    // whether they render the image at all on a sibling `imageAlt` field,
    // to avoid publishing an inaccessible image when alt text was never
    // filled in. An editor adjusting crop/focal mid-edit shouldn't have
    // that silently blank the very image they're trying to preview — the
    // real saved value (and the production render path) is untouched.
    const existingAlt = fieldHost.imageAlt
    const hasAlt = typeof existingAlt === "string" && existingAlt.length > 0
    const patch = {
      [imageFieldName]: adjustedSrc,
      [`${imageFieldName}ImageAdjustment`]: adjustment,
      ...(hasAlt ? {} : { imageAlt: "Preview image" }),
      // A card (nested field) owns an `imageFit` the real component reads to
      // decide cover vs contain. The Fit/Fill toggle lives in modal state and
      // arrives here as `objectFit`; splice it onto the edited card so the
      // real-component preview reflects the toggle live (otherwise it renders
      // the stale saved fit and the preview appears not to update).
      ...(isNestedField ? { imageFit: objectFit } : {}),
    }
    // The real component renders every item in the block (e.g. every
    // InfoCards card) — splice the adjusted single item back into a
    // synthetic single-item block so only it renders. No builder (or it
    // returns nothing) falls back to the framed-image approximation,
    // same as skipRealComponentPreview.
    const component = isNestedField
      ? buildSingleItemPreviewBlock?.(block, { ...fieldHost, ...patch })
      : ({ ...block, ...patch } as IsomerComponent)
    if (!component) return null
    // renderComponent dispatches a bare component with no page layout
    // around it. In a real page, the horizontal gutter/max-width for any
    // element marked `.component-content` (e.g. HeroGradient's text block)
    // comes from an ANCESTOR selector the page layout applies —
    // `[&_.component-content]:px-6 [&_.component-content]:md:px-10
    // [&_.component-content]:max-w-screen-xl [&_.component-content]:mx-auto`
    // (see Homepage.tsx) — not from the component itself. Without this
    // wrapper the text/buttons sit flush left with no padding, even though
    // the background image (a separate, non-"component-content" sibling)
    // renders correctly full-bleed either way.
    return (
      <div
        className={`break-words [&_.component-content]:mx-auto [&_.component-content]:max-w-screen-xl [&_.component-content]:px-6 [&_.component-content]:md:px-10${
          // Single-item preview: force InfoCards' grid (the only `auto-rows-max`
          // element) to one column so the lone card fills the tile at every breakpoint.
          isNestedField ? " [&_.auto-rows-max]:!grid-cols-1" : ""
        }`}
      >
        {renderComponent({
          component,
          layout: pageLayout ?? "content",
          site: PREVIEW_SITE_STUB,
          permalink: "",
          headingLevel: 1,
        })}
      </div>
    )
  }

  // Use the real component for every state when it can be built (and
  // skipRealComponentPreview doesn't opt out); otherwise every state falls
  // through to the framed-<img> approximation.
  const rendered = skipRealComponentPreview ? null : renderPreviewComponent()
  const useRealComponent = !!rendered

  // One rail tile at a given display width — either the real-component render
  // (scaled in an iframe) or the framed-image approximation.
  const renderTile = (
    state: AdjustmentPreviewState,
    width: number,
  ): React.ReactNode => {
    if (useRealComponent) {
      return (
        // The theme fetch suspends AND can throw; without the ErrorBoundary a
        // failed getTheme would tear down the whole modal instead of this one
        // frame degrading to a theme-less (but still correct) preview. If the
        // component itself throws, the theme-less retry throws too, and the
        // inner boundary shows a static "Preview unavailable" tile instead.
        <ErrorBoundary
          key={state.id}
          fallbackRender={() => (
            <ErrorBoundary
              fallbackRender={() => (
                <PreviewTile label={state.label} width={width}>
                  <Text
                    p="0.75rem"
                    textStyle="caption-2"
                    color="base.content.medium"
                  >
                    Preview unavailable
                  </Text>
                </PreviewTile>
              )}
            >
              <PreviewFrame state={state} displayWidth={width}>
                {rendered}
              </PreviewFrame>
            </ErrorBoundary>
          )}
        >
          <Suspense fallback={<Skeleton w={`${width}px`} h="9rem" />}>
            <ThemedPreviewFrame
              siteId={siteId}
              state={state}
              displayWidth={width}
            >
              {rendered}
            </ThemedPreviewFrame>
          </Suspense>
        </ErrorBoundary>
      )
    }

    // Framed-image approximation.
    const aspect = state.aspectRatio
      ? state.aspectRatio.width / state.aspectRatio.height
      : 1
    return (
      <PreviewTile
        key={state.id}
        label={state.label}
        width={width}
        height={width / aspect}
      >
        <Box
          as="img"
          src={adjustedSrc}
          alt={`Preview: ${state.label}`}
          w="100%"
          h="100%"
          style={{
            objectFit,
            // Mirror the renderer: focal is ignored under "contain" (the
            // letterboxed image stays object-center), applied under "cover".
            objectPosition:
              objectFit === "contain"
                ? undefined
                : getFocalObjectPosition(adjustment),
          }}
        />
      </PreviewTile>
    )
  }

  // The widest state fills the rail on its own row; the rest sit two-up below.
  // A state with no explicit viewportWidth renders at PreviewFrame's 1024px
  // default, so rank it as such (not 0) — otherwise a Mobile-only-375 set like
  // InfoCards would wrongly promote Mobile over the (wider) desktop states.
  const bigState = [...previewStates].sort(
    (a, b) => (b.viewportWidth ?? 1024) - (a.viewportWidth ?? 1024),
  )[0]
  const restStates = previewStates.filter((s) => s.id !== bigState?.id)

  const fetchErrorBanner = fetchError && (
    <Text textStyle="caption-2" color="utility.feedback.critical">
      Couldn't load the original image for preview. Showing the current image
      instead.
    </Text>
  )

  return (
    <VStack ref={railRef} align="stretch" spacing="1rem" w="100%">
      {fetchErrorBanner}
      {bigState && renderTile(bigState, railWidth)}
      {restStates.length > 0 && (
        <Flex gap={`${TILE_GAP_PX}px`} wrap="wrap" align="flex-start">
          {restStates.map((state) => renderTile(state, smallTileWidth))}
        </Flex>
      )}
    </VStack>
  )
}

// Shared tile chrome + caption, used by the real-component, framed-image and
// "unavailable" tiles so their frames stay visually identical.
const PreviewTile = ({
  label,
  width,
  height,
  children,
}: {
  label: string
  width: number
  height?: number
  children: React.ReactNode
}): JSX.Element => (
  <VStack align="stretch" spacing="0.375rem" flexShrink={0} w={`${width}px`}>
    <Text
      textStyle="caption-2"
      textTransform="uppercase"
      letterSpacing="0.05em"
      color="base.content.medium"
    >
      {label}
    </Text>
    <Box
      borderWidth="1px"
      borderColor="base.divider.medium"
      borderRadius="0.125rem"
      overflow="hidden"
      bg="base.canvas.default"
      position="relative"
      style={{ width, height }}
    >
      {children}
    </Box>
  </VStack>
)

// Renders the real component inside a simulated device viewport at this
// breakpoint's exact width (so the component's own sm:/md:/lg: Tailwind
// classes evaluate correctly — the iframe's OWN layout viewport is what
// media queries read, which a container shrunk from outside can't fake),
// scaled down to a fixed DISPLAY WIDTH (see FRAME_DISPLAY_WIDTH). The
// frame's HEIGHT is measured from the real rendered content via a
// ResizeObserver inside the iframe, never guessed — so condition (1), the
// preview exactly reflecting the post-publish look, holds regardless of how
// tall any given component's content turns out to be, with nothing cropped
// or hidden behind a scrollbar.
//
// The site's brand theme CSS vars are passed in (via ThemedPreviewFrame) and
// applied to the iframe — without them, Tailwind classes like
// `bg-brand-canvas-inverse` resolve to nothing, which previously caused
// white-on-white text in the HeroBlock preview. They're a prop (not fetched
// here) so this frame still renders if the theme fetch fails — see the
// ErrorBoundary fallback above.
const PreviewFrame = ({
  state,
  displayWidth,
  themeCssVars,
  children,
}: {
  state: AdjustmentPreviewState
  displayWidth: number
  themeCssVars?: CSSProperties
  children: React.ReactNode
}) => {
  const viewportWidth = state.viewportWidth ?? 1024
  // Used only as the initial guess before the real height is measured, to
  // avoid a 0-height flash — corrected immediately on mount.
  const estimatedHeight = state.aspectRatio
    ? Math.round(
        (viewportWidth * state.aspectRatio.height) / state.aspectRatio.width,
      )
    : viewportWidth
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null)
  const viewportHeight = measuredHeight ?? estimatedHeight

  const handleIframeMount = useCallback(
    ({ document: iframeDocument }: IframeCallbackFnProps) => {
      if (!iframeDocument?.body) return
      const update = () => setMeasuredHeight(iframeDocument.body.scrollHeight)
      update()
      // The global ResizeObserver can observe elements belonging to another
      // same-origin document just fine — no need to reach into the iframe's
      // own window for its constructor.
      const observer = new ResizeObserver(update)
      observer.observe(iframeDocument.body)
      // Disconnect on iframe teardown — PreviewIframe runs this when its effect
      // cleans up, so we don't leak observers or setState after unmount.
      return () => observer.disconnect()
    },
    [],
  )

  const scale = displayWidth / viewportWidth

  return (
    <PreviewTile
      label={state.label}
      width={displayWidth}
      height={viewportHeight * scale}
    >
      <Box
        style={{
          width: viewportWidth,
          height: viewportHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <PreviewIframe
          widthPx={viewportWidth}
          heightPx={viewportHeight}
          preventPointerEvents
          style={themeCssVars}
          callback={handleIframeMount}
        >
          {children}
        </PreviewIframe>
      </Box>
    </PreviewTile>
  )
}

// Fetches the site theme (suspends, and throws on error — hence the Suspense +
// ErrorBoundary around it) and hands the CSS vars to PreviewFrame as a prop.
const ThemedPreviewFrame = ({
  siteId,
  state,
  displayWidth,
  children,
}: {
  siteId: number
  state: AdjustmentPreviewState
  displayWidth: number
  children: React.ReactNode
}) => {
  const themeCssVars = useSiteThemeCssVars({ siteId })
  return (
    <PreviewFrame
      state={state}
      displayWidth={displayWidth}
      themeCssVars={themeCssVars}
    >
      {children}
    </PreviewFrame>
  )
}

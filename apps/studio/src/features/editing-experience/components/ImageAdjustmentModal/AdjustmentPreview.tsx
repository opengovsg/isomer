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

// Site stub for a single-block preview. It fills only the fields the block
// reads, as PreviewWithCustomSitemap.tsx does.
const PREVIEW_SITE_STUB = {
  assetsBaseUrl: ASSETS_BASE_URL,
  siteMapArray: [],
} as unknown as IsomerSiteProps

// Returns the bytes to bake. Uses the retained local file when there is one,
// else fetches the true original, never a previous bake.
// On failure it sets fetchError and the preview shows the uncropped src.
const useOriginalImageBlob = (originalSrc: string, originalFile?: Blob) => {
  const [originalBlob, setOriginalBlob] = useState<Blob | null>(null)
  const [fetchError, setFetchError] = useState(false)

  // The transcoded variant can be downscaled or have a generic type the
  // bake rejects, so fetch the pristine original as the save path does.
  const originalFetchUrl = generateOriginalAssetUrl(originalSrc)
  // Fallback when ?original 403s. Ask for webp because the baker rejects avif.
  const plainFetchUrl = generateAssetUrl(originalSrc)

  useEffect(() => {
    let cancelled = false
    if (originalFile) {
      setOriginalBlob(originalFile)
      return
    }
    const fetchOriginal = async () => {
      setFetchError(false)
      // ?original can 403, and a CORS-opaque 403 makes fetch throw. Catch per
      // attempt so a throw still reaches the plain-variant fallback.
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
        // ?original can return a generic "binary/octet-stream" type, so
        // chooseBakeMime falls back to the key's extension. It throws on an
        // unbakeable format, and the preview then stays uncropped.
        let mimeType: string
        try {
          mimeType = chooseBakeMime(
            originalBlob.type,
            originalSrc.replace(/^\//, ""),
          )
        } catch {
          return
        }

        // Baking an animated WebP or APNG would flatten it to one frame.
        if (await isAnimatedImageBlob(originalBlob)) {
          return
        }

        const bakedBlob = await bakeImage(
          originalBlob,
          { crop: debouncedCrop },
          { mimeType },
        )
        // A newer crop started while this bake ran. Drop this result.
        if (isStale()) {
          return
        }
        const bakeUrl = URL.createObjectURL(bakedBlob)
        if (prevPreviewUrlRef.current) {
          URL.revokeObjectURL(prevPreviewUrlRef.current)
        }
        prevPreviewUrlRef.current = bakeUrl
        setPreviewUrl(bakeUrl)
      } catch (error) {
        // Clear the previous preview so a stale crop doesn't stay on screen,
        // unless a newer bake has superseded this one.
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
  // Raw stored path of the true original, e.g. "/1/uuid/file.png". Equals
  // `src` on a first edit. On a re-edit `src` is the previous bake.
  originalSrc: string
  // Original bytes kept from an upload this session. Lets the preview work
  // while the malware scan still gates the uploaded original.
  originalFile?: Blob
  adjustment?: ImageAdjustment
  previewStates: AdjustmentPreviewState[]
  // The block and the image's field name, for rendering the real component.
  // Without them the preview uses the framed-image approximation.
  block?: IsomerComponent
  imageFieldName?: string
  // The object that holds the field. Equals `block` for a root-level field,
  // and is the single item, e.g. one InfoCards card, for an array-nested one.
  fieldHost?: Record<string, unknown>
  // Builds a one-item block for an array-nested field. Without it the
  // preview uses the framed-image approximation.
  buildSingleItemPreviewBlock?: BuildSingleItemPreviewBlock
  // Always use the framed-image approximation. Set for array-nested fields
  // with no builder, e.g. ImageGallery.
  skipRealComponentPreview?: boolean
  // object-fit for the framed-image approximation and for a nested item's
  // `imageFit`. Defaults to "cover".
  objectFit?: "cover" | "contain"
  // The layout the published page renders at. Defaults to "content".
  pageLayout?: IsomerPageLayoutType
  // Used to load the site's brand theme CSS vars into the preview iframe.
  siteId: number
}

// Gap between the two small tiles in the rail's second row.
const TILE_GAP_PX = 12
// The rail's Figma width, used until the ResizeObserver reports.
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
  // Tile widths derive from the rail's measured width.
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

  // Show the local original before the first bake. A fresh upload's CDN
  // variant may still 404.
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

  // `src` is the raw stored path. Resolve it to the asset domain for display.
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

  // Renders the real published block with the adjusted image and the draft
  // adjustment patched in, at the page's own layout.
  const renderPreviewComponent = (): React.ReactNode => {
    if (!block || !fieldHost || !imageFieldName) return null
    const isNestedField = fieldHost !== block
    // Some components, e.g. Blockquote, hide the image when `imageAlt` is
    // empty. Fill it in for the preview only so the image still shows.
    const existingAlt = fieldHost.imageAlt
    const hasAlt = typeof existingAlt === "string" && existingAlt.length > 0
    const patch = {
      [imageFieldName]: adjustedSrc,
      [`${imageFieldName}ImageAdjustment`]: adjustment,
      ...(hasAlt ? {} : { imageAlt: "Preview image" }),
      // The real component reads a nested item's `imageFit`. Patch in the
      // modal's Fit/Fill choice so the preview follows the toggle.
      ...(isNestedField ? { imageFit: objectFit } : {}),
    }
    // The real component renders every item, so build a one-item block.
    // No builder means the framed-image approximation.
    const component = isNestedField
      ? buildSingleItemPreviewBlock?.(block, { ...fieldHost, ...patch })
      : ({ ...block, ...patch } as IsomerComponent)
    if (!component) return null
    // On a real page the layout styles `.component-content` from an ancestor
    // selector, see Homepage.tsx. Without this wrapper the text and buttons
    // sit flush left.
    return (
      <div
        className={`break-words [&_.component-content]:mx-auto [&_.component-content]:max-w-screen-xl [&_.component-content]:px-6 [&_.component-content]:md:px-10${
          // InfoCards' grid is the only `auto-rows-max` element. One column
          // makes the lone card fill the tile.
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

  const rendered = skipRealComponentPreview ? null : renderPreviewComponent()
  const useRealComponent = !!rendered

  const renderTile = (
    state: AdjustmentPreviewState,
    width: number,
  ): React.ReactNode => {
    if (useRealComponent) {
      return (
        // The theme fetch can throw. The outer boundary retries without the
        // theme. If the component itself throws, the inner one shows
        // "Preview unavailable".
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
            // As in the renderer, "contain" ignores the focal point.
            objectPosition:
              objectFit === "contain"
                ? undefined
                : getFocalObjectPosition(adjustment),
          }}
        />
      </PreviewTile>
    )
  }

  // The widest state gets its own row. A state with no viewportWidth
  // renders at PreviewFrame's 1024px default, so rank it as 1024.
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

// Shared frame and caption for all three tile kinds.
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

// Renders the real component in an iframe as wide as the breakpoint, so its
// media queries evaluate against that width, then scales it to displayWidth.
// A ResizeObserver in the iframe measures the height.
// themeCssVars is a prop so the frame still renders if the theme fetch fails.
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
  // Initial guess to avoid a 0-height flash before the first measure.
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
      // The global ResizeObserver can observe a same-origin iframe's elements.
      const observer = new ResizeObserver(update)
      observer.observe(iframeDocument.body)
      // PreviewIframe runs this cleanup when the iframe tears down.
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

// Fetches the site theme. It suspends and can throw, so callers wrap it in
// Suspense and an ErrorBoundary.
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

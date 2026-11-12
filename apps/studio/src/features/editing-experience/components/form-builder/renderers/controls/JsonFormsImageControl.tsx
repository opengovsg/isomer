import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import type { ImageAdjustment } from "@opengovsg/isomer-components"
import {
  Box,
  FormControl,
  RadioGroup,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  Infobox,
  Link,
  Radio,
  useToast,
} from "@opengovsg/design-system-react"
import {
  IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
  IMAGE_FIT,
} from "@opengovsg/isomer-components"
import dynamic from "next/dynamic"
import posthog from "posthog-js"
import { useEffect, useRef, useState } from "react"
import { AttachmentData } from "~/components/AttachmentData"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { fetchImageBlob } from "~/features/editing-experience/components/ImageAdjustmentModal/useSaveImageAdjustment"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useIsImageAdjustmentEnabled } from "~/hooks/useIsImageAdjustmentEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import {
  canBakeImage,
  isAnimatedImageBlob,
  mimeFromKeyExtension,
} from "~/lib/imageBake"
import { generateAssetUrl } from "~/utils/generateAssetUrl"

import { useAdjustmentConfigForField } from "../../hooks/useAdjustmentConfigForField"
import { useAssetUpload } from "../../hooks/useAssetUpload"
import { isManagedSiteAsset } from "./isManagedSiteAsset"
import { getCustomErrorMessage } from "./utils"

// Covers the WebP VP8X flags and a PNG's acTL chunk, which sits before IDAT.
const ANIMATION_SNIFF_BYTES = 64 * 1024

// Every FormBuilder page loads this control. Lazy-load the modal to keep its
// canvas bake, crop and preview code out of that shared bundle.
const ImageAdjustmentModal = dynamic(() =>
  import("~/features/editing-experience/components/ImageAdjustmentModal").then(
    (mod) => mod.ImageAdjustmentModal,
  ),
)

export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "image"),
  ),
)
interface JsonFormsImageControlProps extends ControlProps {
  data: string
  schema: JsonSchema & {
    maxSizeInBytes?: number
    allowedMimeTypeMappings?: Record<string, string>
  }
}
function JsonFormsImageControl({
  label,
  handleChange,
  path,
  required,
  errors,
  description,
  data,
  schema,
}: JsonFormsImageControlProps) {
  const { siteId, pageId, linkId } = useQueryParse(pageOrLinkSchema)
  const resourceId = (pageId ?? linkId) ? String(pageId ?? linkId) : undefined
  const {
    isOpen: isAdjustmentModalOpen,
    onOpen: onAdjustmentModalOpen,
    onClose: onAdjustmentModalClose,
  } = useDisclosure()
  // Gate the adjustment entry point behind a GrowthBook flag (off by default,
  // rolled out per-user) — this is a rollout-sensitive editor path.
  const isImageAdjustmentEnabled = useIsImageAdjustmentEnabled()
  // Undefined in the link editor, which has no EditorDrawerProvider.
  // AdjustmentPreview then falls back to "content".
  const pageLayout = useOptionalEditorDrawerContext()?.previewPageState.layout
  // External URLs and the placeholder have no bake key, so Save would fail.
  const isManagedAsset = isManagedSiteAsset(data, siteId)
  // "Replace image" clicks the file input of the hidden FileAttachment below.
  const replaceUploadRef = useRef<HTMLDivElement>(null)
  // The bake-presign mutation requires a resourceId; without a page/link in
  // the URL there's nothing to pass (the save call would send an empty
  // string and fail server-side), so hide Adjust rather than let an editor
  // open the modal, make changes, and hit a save error.
  const hasResourceContext = resourceId !== undefined

  const {
    block,
    fieldHost,
    fieldName,
    siblingPath,
    currentAdjustment,
    config,
  } = useAdjustmentConfigForField(path)

  // Editors can upload AVIF and TIFF, but canvas can't re-encode them.
  const isBakeableFormat =
    !!data && canBakeImage(mimeFromKeyExtension(data) ?? "")

  // The animation check below narrows this further once it settles.
  const canAdjustBase =
    isImageAdjustmentEnabled &&
    isManagedAsset &&
    hasResourceContext &&
    !!config &&
    isBakeableFormat

  const showUnsupportedFormatCallout =
    isImageAdjustmentEnabled && isManagedAsset && !!config && !isBakeableFormat

  // Keep the uploaded File so the editor can bake from local bytes while the
  // malware scan still blocks the uploaded original. onUploadedFile gets the
  // File and setHref gets its key, so pendingFileRef carries one to the other.
  const pendingFileRef = useRef<File | null>(null)
  const uploadedOriginalRef = useRef<{ key: string; file: File } | null>(null)

  // Mirrors resolveOriginalKey. Inlined to keep imageBake out of this bundle.
  const editingOriginalKey =
    currentAdjustment?.originalKey || data?.replace(/^\//, "")
  // Check the ref first. On an empty field both keys are undefined, so a bare
  // `?.key === editingOriginalKey` matches and dereferences null.
  const uploadedOriginal = uploadedOriginalRef.current
  const originalFile =
    uploadedOriginal && uploadedOriginal.key === editingOriginalKey
      ? uploadedOriginal.file
      : undefined

  // Baking flattens animated WebP and APNG to one frame, so save rejects them.
  // Detect them here instead. Fails open, the save-time guard is the backstop.
  // Only WebP and PNG can animate, so other formats skip the fetch.
  const assetMime = data ? mimeFromKeyExtension(data) : undefined
  const couldBeAnimated =
    assetMime === "image/webp" || assetMime === "image/png"
  const [isAnimatedAsset, setIsAnimatedAsset] = useState(false)
  // Auto-open waits on this so it never opens an animated upload.
  const [animationResolved, setAnimationResolved] = useState(false)
  useEffect(() => {
    if (!canAdjustBase || !editingOriginalKey || !couldBeAnimated) {
      setIsAnimatedAsset(false)
      setAnimationResolved(true)
      return
    }
    let cancelled = false
    setAnimationResolved(false)
    const blobPromise = originalFile
      ? Promise.resolve(originalFile)
      : // Animation markers sit in the header. Fetch a prefix, or the full
        // file if the server refuses the ranged request.
        fetchImageBlob(
          `/${editingOriginalKey}`,
          undefined,
          ANIMATION_SNIFF_BYTES,
        ).catch(() => fetchImageBlob(`/${editingOriginalKey}`))
    blobPromise
      .then(isAnimatedImageBlob)
      .then((animated) => {
        if (!cancelled) {
          setIsAnimatedAsset(animated)
          setAnimationResolved(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAnimatedAsset(false)
          setAnimationResolved(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [canAdjustBase, editingOriginalKey, originalFile, couldBeAnimated])

  const canAdjust = canAdjustBase && !isAnimatedAsset

  const showAnimatedFormatCallout = canAdjustBase && isAnimatedAsset

  // Auto-open the editor after a fresh upload only. Page loads and history
  // restores never set this ref.
  const justUploadedRef = useRef(false)
  useEffect(() => {
    if (!justUploadedRef.current) return
    if (!animationResolved) return
    justUploadedRef.current = false
    if (canAdjust) {
      posthog.capture("image_adjustment_modal_opened", {
        site_id: siteId,
        resource_id: resourceId,
        source: "post_upload",
      })
      onAdjustmentModalOpen()
    }
  }, [animationResolved, canAdjust, onAdjustmentModalOpen, siteId, resourceId])

  // InfoCards' cards and the collection thumbnail own a sibling `imageFit`
  // field. The modal's fit control writes back to it.
  const hasImageFitField = config?.ownsImageFitField ?? false
  const initialImageFit = hasImageFitField
    ? fieldHost?.imageFit === "contain"
      ? "contain"
      : "cover"
    : undefined

  const imageFitPath = [path.split(".").slice(0, -1).join("."), "imageFit"]
    .filter(Boolean)
    .join(".")

  // Shared by the empty-field uploader and the hidden "Replace image" one.
  const { handleAssetUpload, isLoading } = useAssetUpload({})
  const toast = useToast()
  const uploadFileAttachmentProps = {
    maxSizeInBytes: schema.maxSizeInBytes ?? MAX_IMG_FILE_SIZE_BYTES,
    acceptedFileTypes:
      schema.allowedMimeTypeMappings ?? IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
    siteId,
    resourceId,
    onUploadedFile: (file: File) => {
      pendingFileRef.current = file
    },
    onUploadSuccess: () => {
      posthog.capture("image_upload_completed", {
        site_id: siteId,
        resource_id: resourceId,
      })
    },
    setHref: (src?: string) => {
      if (!src) {
        handleChange(path, undefined)
        return
      }
      // Take the File now. A later upload may overwrite the ref mid-wait.
      const file = pendingFileRef.current
      pendingFileRef.current = null
      // Save the path only once the CDN serves it, so the preview can load it.
      void handleAssetUpload(src)
        .then(() => {
          handleChange(path, src)
          // The old crop, focal point and originalKey don't fit a new asset.
          if (currentAdjustment) handleChange(siblingPath, undefined)
          justUploadedRef.current = true
          // Stops auto-open acting on the previous asset's animation result.
          setAnimationResolved(false)
          if (file) {
            uploadedOriginalRef.current = {
              key: src.replace(/^\//, ""),
              file,
            }
          }
        })
        .catch(() => {
          toast({
            title: "Failed to upload file",
            description: "Please try again.",
            status: "error",
            ...BRIEF_TOAST_SETTINGS,
          })
        })
    },
    isLoading,
  }

  const handleAdjustmentSave = ({
    src,
    imageAdjustment,
    imageFit,
  }: {
    src: string
    imageAdjustment: ImageAdjustment | undefined
    imageFit?: "cover" | "contain"
  }) => {
    handleChange(path, src)
    handleChange(siblingPath, imageAdjustment)
    if (imageFit !== undefined) {
      handleChange(imageFitPath, imageFit)
    }
  }

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>
      {isImageAdjustmentEnabled && config?.preUploadCopy && (
        <Infobox
          variant="info"
          size="sm"
          mb="0.75rem"
          border="1px solid"
          borderColor="utility.feedback.info"
          borderRadius="0.25rem"
        >
          <Text textStyle="body-2">
            {config.preUploadCopy}{" "}
            <Link href="https://sample.isomer.gov.sg" isExternal>
              Learn more about image guidelines
            </Link>
          </Text>
        </Infobox>
      )}
      {/* While a replacement waits for the CDN, show the uploader's skeleton. */}
      {data && !isLoading ? (
        <Box>
          <AttachmentData
            data={data.split("/").pop() ?? "Unknown"}
            // Not ?original, which 403s until the malware scan tags the object.
            imageSrc={generateAssetUrl(data)}
            onEdit={
              canAdjust
                ? () => {
                    posthog.capture("image_adjustment_modal_opened", {
                      site_id: siteId,
                      resource_id: resourceId,
                      source: "manual_edit",
                    })
                    onAdjustmentModalOpen()
                  }
                : // Not adjustable, so open the hidden uploader below.
                  () =>
                    replaceUploadRef.current
                      ?.querySelector<HTMLInputElement>('input[type="file"]')
                      ?.click()
            }
            editLabel={canAdjust ? undefined : "Replace image"}
            onClick={() => {
              // Clear the sibling adjustment too — otherwise a stale
              // imageAdjustment (with an originalKey pointing at the removed
              // image) survives and gets misapplied to whatever is uploaded
              // next at this field.
              handleChange(path, undefined)
              if (currentAdjustment) handleChange(siblingPath, undefined)
              uploadedOriginalRef.current = null
            }}
          />
          {canAdjust && (
            <ImageAdjustmentModal
              key={data}
              isOpen={isAdjustmentModalOpen}
              onClose={onAdjustmentModalClose}
              config={config}
              src={data}
              value={currentAdjustment}
              block={block}
              imageFieldName={fieldName}
              fieldHost={fieldHost}
              originalFile={originalFile}
              pageLayout={pageLayout}
              siteId={siteId}
              resourceId={resourceId}
              initialImageFit={initialImageFit}
              onSave={handleAdjustmentSave}
            />
          )}
          {/* The modal owns the fit toggle. Offer it inline when the modal
              can't open. */}
          {hasImageFitField && !canAdjust && (
            <FormControl mt="1rem">
              <FormLabel description='Select "Resize image to fit" only if the image has a white background.'>
                Image display
              </FormLabel>
              <RadioGroup
                aria-label="Image display"
                value={initialImageFit}
                onChange={(value) => handleChange(imageFitPath, value)}
              >
                <Radio my="1px" value={IMAGE_FIT.Cover} allowDeselect={false}>
                  Default (recommended)
                </Radio>
                <Radio my="1px" value={IMAGE_FIT.Content} allowDeselect={false}>
                  Resize image to fit
                </Radio>
              </RadioGroup>
            </FormControl>
          )}
          {showAnimatedFormatCallout && (
            <Infobox variant="warning" size="sm" mt="0.75rem">
              <Text textStyle="body-2">
                Animated images can't be adjusted. Editing would flatten it to a
                single frame.
              </Text>
            </Infobox>
          )}
          {showUnsupportedFormatCallout && (
            <Infobox variant="warning" size="sm" mt="0.75rem">
              <Text textStyle="body-2">
                Only JPG, PNG and WebP can be edited
              </Text>
            </Infobox>
          )}
          {!canAdjust && (
            // Hidden. "Replace image" above clicks its file input.
            <Box display="none">
              <FileAttachment
                ref={replaceUploadRef}
                {...uploadFileAttachmentProps}
              />
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          <FileAttachment {...uploadFileAttachmentProps} />
        </Box>
      )}
      {!!errors && (
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      )}
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)

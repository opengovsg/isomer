import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { Box, FormControl, Text, useDisclosure } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  Infobox,
  Link,
} from "@opengovsg/design-system-react"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import dynamic from "next/dynamic"
import posthog from "posthog-js"
import { useEffect, useRef, useState } from "react"
import { AttachmentData } from "~/components/AttachmentData"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { PLACEHOLDER_IMAGE_FILENAME } from "~/features/editing-experience/components/constants"
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
import { isManagedSiteAsset } from "./isManagedSiteAsset"
import { getCustomErrorMessage } from "./utils"

// JsonFormsImageControl is registered as a renderer for every FormBuilder
// instance (every settings page and content-block editor), regardless of
// whether that schema even has an image field. ImageAdjustmentModal pulls in
// canvas baking/crop/preview code that's only relevant behind a per-agency
// GrowthBook flag (off by default) — load it lazily so it doesn't bloat every
// FormBuilder page's shared bundle.
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
  // Only managed site-storage assets (relative "/..." paths) can be baked;
  // external/absolute URLs and the built-in placeholder have no derivable bake
  // key, so hide Adjust for them rather than letting Save fail.
  const isManagedAsset = isManagedSiteAsset(data, siteId)
  // The built-in placeholder means no real image has been uploaded yet —
  // offer "Replace image" (opens the upload flow) instead of an edit/adjust
  // affordance, which doesn't apply to a stock asset.
  const isPlaceholderImage = data === `/${PLACEHOLDER_IMAGE_FILENAME}`
  // Lets the "Replace image" text open the same upload flow used for a fresh
  // upload (see the hidden FileAttachment below), by finding and clicking its
  // file input directly.
  const replaceUploadRef = useRef<HTMLDivElement>(null)
  // The bake-presign mutation requires a resourceId; without a page/link in
  // the URL there's nothing to pass (the save call would send an empty
  // string and fail server-side), so hide Adjust rather than let an editor
  // open the modal, make changes, and hit a save error.
  const hasResourceContext = resourceId !== undefined

  // Reads the sibling imageAdjustment field and containing block via
  // JsonForms' core data (the only way to reach data outside this control's
  // own path) and memoizes the derived config -- see the hook's own comment
  // for why that matters.
  const {
    block,
    fieldHost,
    fieldName,
    siblingPath,
    currentAdjustment,
    config,
  } = useAdjustmentConfigForField(path)

  // AVIF/TIFF etc. are uploadable but can't be baked (canvas can't re-encode
  // them), so the editor would fail on save. Derive editability from the
  // asset's extension and gate the entry point on it.
  const isBakeableFormat =
    !!data && canBakeImage(mimeFromKeyExtension(data) ?? "")

  // The adjustment entry point shows only when the flag is on, the asset is a
  // managed, bakeable-format asset, and the owning component has a config.
  // Animated-format detection (below) further gates this once it resolves.
  const canAdjustBase =
    isImageAdjustmentEnabled &&
    isManagedAsset &&
    hasResourceContext &&
    !!config &&
    isBakeableFormat

  // Same asset that would be adjustable but for its format — tell the user why
  // the editor isn't offered, rather than silently hiding the pencil.
  const showUnsupportedFormatCallout =
    isImageAdjustmentEnabled && isManagedAsset && !!config && !isBakeableFormat

  // Retain the just-uploaded File client-side (never sent to the Studio server —
  // it goes direct to S3 via a presigned PUT) so the editor can bake from local
  // bytes while the uploaded original is still gated by the malware-scan window.
  // pendingFileRef bridges onUploadedFile (has the File) and setHref (has the
  // resulting key); uploadedOriginalRef holds the committed {key, file}.
  const pendingFileRef = useRef<File | null>(null)
  const uploadedOriginalRef = useRef<{ key: string; file: File } | null>(null)

  // The original key for the image being edited — `data` on a first edit, or the
  // stored originalKey on a re-edit. Mirrors resolveOriginalKey, inlined to keep
  // the heavy imageBake module out of this shared bundle (see dynamic import).
  const editingOriginalKey =
    currentAdjustment?.originalKey || data?.replace(/^\//, "")
  // Guard on the ref being populated first: for an empty field (e.g. the favicon
  // slot) editingOriginalKey is undefined, and a bare `?.key === editingOriginalKey`
  // is `undefined === undefined` → true, which would dereference a null ref. Only
  // match a real retained upload for this exact key.
  const uploadedOriginal = uploadedOriginalRef.current
  const originalFile =
    uploadedOriginal && uploadedOriginal.key === editingOriginalKey
      ? uploadedOriginal.file
      : undefined

  // Animated WebP/APNG pass the MIME/extension gate above but useSaveImageAdjustment
  // rejects them at save time (baking would flatten them to one frame) — detect
  // it up front so the editor isn't offered just to fail later. Fails open: stays
  // false while the check is pending or if it errors, since the save-time guard
  // remains the backstop. Only WebP and PNG can carry animation, so skip the
  // (full-image) fetch entirely for every other format — the common JPEG case
  // never downloads just to sniff a header it can't have.
  const assetMime = data ? mimeFromKeyExtension(data) : undefined
  const couldBeAnimated =
    assetMime === "image/webp" || assetMime === "image/png"
  const [isAnimatedAsset, setIsAnimatedAsset] = useState(false)
  // Whether the animation check has settled for the current asset. Auto-open
  // waits on this so a freshly-uploaded animated image is never popped open
  // before we've ruled it out (reset to false on each new upload in setHref).
  const [animationResolved, setAnimationResolved] = useState(false)
  useEffect(() => {
    // Nothing to fetch (not adjustable, or a format that can't animate) — settle
    // immediately as "not animated".
    if (!canAdjustBase || !editingOriginalKey || !couldBeAnimated) {
      setIsAnimatedAsset(false)
      setAnimationResolved(true)
      return
    }
    let cancelled = false
    setAnimationResolved(false)
    const blobPromise = originalFile
      ? Promise.resolve(originalFile)
      : fetchImageBlob(`/${editingOriginalKey}`)
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

  // Tell the user why an otherwise-adjustable asset can't be edited, rather
  // than silently hiding the pencil.
  const showAnimatedFormatCallout = canAdjustBase && isAnimatedAsset

  // Auto-open the editor right after a fresh upload (set in FileAttachment's
  // setHref below) for every component resolveAdjustmentConfig has a config
  // for — not on page load for an already-saved image, not on undo/history
  // restores, and not for Tier D (no config) components, which keep only the
  // manual Edit/Adjust button.
  const justUploadedRef = useRef(false)
  useEffect(() => {
    if (!justUploadedRef.current) return
    // Wait for the animation check to settle before deciding, so an animated
    // upload is never auto-opened in the window before it's ruled out.
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

  // Some components (InfoCards' cards, the collection thumbnail) own a
  // sibling `imageFit` field that the modal's fit control writes back to —
  // gated by the config's ownsImageFitField flag so other components never
  // get an unexpected imageFit control.
  const hasImageFitField = config?.ownsImageFitField ?? false
  const initialImageFit = hasImageFitField
    ? ((fieldHost as { imageFit?: "cover" | "contain" } | null)?.imageFit ??
      "cover")
    : undefined

  // Sibling path for the field host's imageFit field, mirroring siblingPath's
  // parent+field construction for imageAdjustment.
  const imageFitPath = [path.split(".").slice(0, -1).join("."), "imageFit"]
    .filter(Boolean)
    .join(".")

  // Shared by the empty-field upload UI and the hidden "Replace image" upload
  // (triggered via replaceUploadRef) — both are the same upload flow, so the
  // field value is fully replaced by the new asset either way, never layered.
  const uploadFileAttachmentProps = {
    maxSizeInBytes: schema.maxSizeInBytes ?? MAX_IMG_FILE_SIZE_BYTES,
    acceptedFileTypes:
      schema.allowedMimeTypeMappings ?? IMAGE_ACCEPTED_MIME_TYPE_MAPPING,
    siteId,
    resourceId,
    onUploadedFile: (file: File) => {
      // Stash the picked File; setHref below pairs it with its key.
      pendingFileRef.current = file
    },
    onUploadSuccess: () => {
      posthog.capture("image_upload_completed", {
        site_id: siteId,
        resource_id: resourceId,
      })
    },
    setHref: (src?: string) => {
      handleChange(path, src)
      // Mark a real upload (not the loading-state "" or a clear) so the
      // editor auto-opens once the new src lands and canAdjust is true.
      if (src) {
        justUploadedRef.current = true
        // New asset → force the auto-open gate to wait for a fresh
        // animation check (avoids acting on the prior asset's result).
        setAnimationResolved(false)
        if (pendingFileRef.current) {
          uploadedOriginalRef.current = {
            key: src.replace(/^\//, ""),
            file: pendingFileRef.current,
          }
          pendingFileRef.current = null
        }
      }
    },
    shouldFetchResource: true,
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
      {/* Guidance shown at all times (before and after upload), per the
          component's real frame behaviour — a border matching the info icon. */}
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
      {data ? (
        <Box>
          {/* Adjustment entry point — a pencil on the file row, only for
              components with a config and only for managed (bakeable) assets. */}
          <AttachmentData
            data={data.split("/").pop() ?? "Unknown"}
            // Plain (optimized) URL — the ?original object is gated by a
            // malware-scan tag and 403s; the variant is fine for a thumbnail.
            imageSrc={generateAssetUrl(data)}
            onEdit={
              isPlaceholderImage
                ? // No real image uploaded yet — reuse the same upload flow as
                  // the empty-field FileAttachment below (hidden, see
                  // replaceUploadRef) instead of the adjustment modal.
                  () =>
                    replaceUploadRef.current
                      ?.querySelector<HTMLInputElement>('input[type="file"]')
                      ?.click()
                : canAdjust
                  ? () => {
                      posthog.capture("image_adjustment_modal_opened", {
                        site_id: siteId,
                        resource_id: resourceId,
                        source: "manual_edit",
                      })
                      onAdjustmentModalOpen()
                    }
                  : undefined
            }
            editLabel={isPlaceholderImage ? "Replace image" : undefined}
            // Unsupported format: show a disabled Edit affordance with a tooltip
            // instead of opening the editor.
            editDisabledReason={
              showUnsupportedFormatCallout
                ? "Only JPG, PNG and WebP can be edited"
                : undefined
            }
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
              siteId={siteId}
              resourceId={resourceId}
              initialImageFit={initialImageFit}
              onSave={handleAdjustmentSave}
            />
          )}
          {showAnimatedFormatCallout && (
            <Infobox variant="warning" size="sm" mt="0.75rem">
              <Text textStyle="body-2">
                Animated images can't be adjusted. Editing would flatten it to a
                single frame.
              </Text>
            </Infobox>
          )}
          {isPlaceholderImage && (
            // Not shown — only here so "Replace image" above can open the
            // native file picker via replaceUploadRef.current.click(), reusing
            // this exact upload flow instead of a second implementation.
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

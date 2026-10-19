import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { Box, FormControl, Text, useDisclosure } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormLabel,
  Infobox,
} from "@opengovsg/design-system-react"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import dynamic from "next/dynamic"
import { useEffect, useRef } from "react"
import { AttachmentData } from "~/components/AttachmentData"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useIsImageAdjustmentEnabled } from "~/hooks/useIsImageAdjustmentEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import { canBakeImage, mimeFromKeyExtension } from "~/lib/imageBake"
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
  const canAdjust =
    isImageAdjustmentEnabled && isManagedAsset && !!config && isBakeableFormat

  // Same asset that would be adjustable but for its format — tell the user why
  // the editor isn't offered, rather than silently hiding the pencil.
  const showUnsupportedFormatCallout =
    isImageAdjustmentEnabled && isManagedAsset && !!config && !isBakeableFormat

  // Auto-open the editor right after a fresh upload (set in FileAttachment's
  // setHref below) once the new asset turns out to be adjustable — not on page
  // load for an already-saved image.
  const justUploadedRef = useRef(false)
  useEffect(() => {
    if (justUploadedRef.current && canAdjust) {
      justUploadedRef.current = false
      onAdjustmentModalOpen()
    }
  }, [canAdjust, onAdjustmentModalOpen])

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

  const handleAdjustmentSave = ({
    src,
    imageAdjustment,
  }: {
    src: string
    imageAdjustment: ImageAdjustment | undefined
  }) => {
    handleChange(path, src)
    handleChange(siblingPath, imageAdjustment)
  }

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>
      {data ? (
        <Box>
          {/* Adjustment entry point — a pencil on the file row, only for
              components with a config and only for managed (bakeable) assets. */}
          <AttachmentData
            data={data.split("/").pop() ?? "Unknown"}
            // Plain (optimized) URL — the ?original object is gated by a
            // malware-scan tag and 403s; the variant is fine for a thumbnail.
            imageSrc={generateAssetUrl(data)}
            onEdit={canAdjust ? onAdjustmentModalOpen : undefined}
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
              resourceId={
                (pageId ?? linkId) ? String(pageId ?? linkId) : undefined
              }
              onSave={handleAdjustmentSave}
            />
          )}
          {showUnsupportedFormatCallout && (
            <Infobox variant="warning" size="sm" mt="0.75rem">
              <Text textStyle="body-2">
                This image's format can't be edited. Only JPEG, PNG, and WebP
                images can be cropped or adjusted.
              </Text>
            </Infobox>
          )}
        </Box>
      ) : (
        <Box>
          {/* Pre-upload guidance — shown before a file is chosen, per the
              component's real frame behaviour (never a universal ratio for a
              responsive frame). */}
          {isImageAdjustmentEnabled && config?.preUploadCopy && (
            <Infobox variant="info" size="sm" mb="0.75rem">
              <Text textStyle="body-2">{config.preUploadCopy}</Text>
            </Infobox>
          )}
          <FileAttachment
            maxSizeInBytes={schema.maxSizeInBytes ?? MAX_IMG_FILE_SIZE_BYTES}
            acceptedFileTypes={
              schema.allowedMimeTypeMappings ?? IMAGE_ACCEPTED_MIME_TYPE_MAPPING
            }
            siteId={siteId}
            resourceId={
              (pageId ?? linkId) ? String(pageId ?? linkId) : undefined
            }
            onUploadedFile={(file) => {
              // Stash the picked File; setHref below pairs it with its key.
              pendingFileRef.current = file
            }}
            setHref={(src) => {
              handleChange(path, src)
              // Mark a real upload (not the loading-state "" or a clear) so the
              // editor auto-opens once the new src lands and canAdjust is true.
              if (src) {
                justUploadedRef.current = true
                if (pendingFileRef.current) {
                  uploadedOriginalRef.current = {
                    key: src.replace(/^\//, ""),
                    file: pendingFileRef.current,
                  }
                  pendingFileRef.current = null
                }
              }
            }}
            shouldFetchResource={true}
          />
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

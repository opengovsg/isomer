import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { Box, FormControl, Text, useDisclosure } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import dynamic from "next/dynamic"
import { BiPencil } from "react-icons/bi"
import { AttachmentData } from "~/components/AttachmentData"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useIsImageAdjustmentEnabled } from "~/hooks/useIsImageAdjustmentEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"

import { useAdjustmentConfigForField } from "../../hooks/useAdjustmentConfigForField"
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
  // Only managed site-storage assets (relative "/{siteId}/..." paths) can be
  // baked; external/absolute URLs have no derivable bake key, so hide Adjust
  // for them rather than letting Save fail.
  const isManagedAsset = !!data && data.startsWith("/")
  // The bake-presign mutation requires a resourceId; without a page/link in
  // the URL there's nothing to pass (the save call would send an empty
  // string and fail server-side), so hide Adjust rather than let an editor
  // open the modal, make changes, and hit a save error.
  const hasResourceContext = !!(pageId ?? linkId)

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
          <AttachmentData
            data={data.split("/").pop() ?? "Unknown"}
            onClick={() => {
              // Clear the sibling adjustment too — otherwise a stale
              // imageAdjustment (with an originalKey pointing at the removed
              // image) survives and gets misapplied to whatever is uploaded
              // next at this field.
              handleChange(path, undefined)
              if (currentAdjustment) handleChange(siblingPath, undefined)
            }}
          />
          {/* Adjustment entry point — only for components with a config, and
              only for managed (bakeable) assets */}
          {isImageAdjustmentEnabled &&
            isManagedAsset &&
            hasResourceContext &&
            config && (
              <>
                <Button
                  leftIcon={<BiPencil />}
                  variant="clear"
                  colorScheme="neutral"
                  mt="1rem"
                  onClick={onAdjustmentModalOpen}
                >
                  Adjust image
                </Button>

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
                  siteId={siteId}
                  resourceId={
                    (pageId ?? linkId) ? String(pageId ?? linkId) : undefined
                  }
                  onSave={handleAdjustmentSave}
                />
              </>
            )}
        </Box>
      ) : (
        <Box>
          {/* Pre-upload guidance — shown before a file is chosen, per the
              component's real frame behaviour (never a universal ratio for a
              responsive frame). */}
          {isImageAdjustmentEnabled && config?.preUploadCopy && (
            <Box
              w="100%"
              mb="0.75rem"
              p="1rem"
              bgColor="utility.ui"
              borderRadius="0.25rem"
              borderWidth="1px"
              borderColor="base.divider.medium"
            >
              <Text textStyle="body-2">{config.preUploadCopy}</Text>
            </Box>
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
            setHref={(src) => handleChange(path, src)}
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

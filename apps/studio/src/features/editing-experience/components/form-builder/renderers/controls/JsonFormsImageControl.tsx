import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import type { ImageAdjustment } from "@opengovsg/isomer-components"
import { Box, FormControl, HStack, Text, useDisclosure } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps, useJsonForms } from "@jsonforms/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { BiPencil } from "react-icons/bi"
import { AttachmentData } from "~/components/AttachmentData"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { ImageAdjustmentModal } from "~/features/editing-experience/components/ImageAdjustmentModal"
import { resolveAdjustmentConfig } from "~/features/editing-experience/components/ImageAdjustmentModal/adjustmentConfigRegistry"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"

import { getCustomErrorMessage } from "./utils"

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
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Access JsonForms context to read the sibling imageAdjustment field.
  const ctx = useJsonForms()
  const rootData = ctx.core?.data

  // Extract path parts for sibling and block lookups.
  const pathParts = path.split(".")
  const fieldName = pathParts.pop() ?? ""
  const parentPath = pathParts.join(".")

  // Compute sibling path for imageAdjustment (e.g. "content.3.backgroundUrl" -> "content.3.imageAdjustment").
  const siblingPath = [parentPath, "imageAdjustment"].filter(Boolean).join(".")
  const currentAdjustment = get(rootData, siblingPath) as
    | ImageAdjustment
    | undefined
  // Per-block editor forms (e.g. HeroEditorDrawer) mount the form with the block
  // itself as the data root, so the image field is top-level and parentPath is
  // empty — in that case the block IS rootData.
  const block = parentPath ? get(rootData, parentPath) : rootData
  const config = resolveAdjustmentConfig({ block, fieldName })

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
            onClick={() => handleChange(path, undefined)}
          />
          {/* Adjustment entry point — only for components with a config */}
          {config && (
            <>
              <HStack spacing="1rem" mt="1rem">
                <Button
                  leftIcon={<BiPencil />}
                  variant="clear"
                  colorScheme="neutral"
                  onClick={onOpen}
                >
                  Adjust image
                </Button>
                <Text textStyle="body-2" color="base.content.medium">
                  {currentAdjustment ? "Adjusted" : "Not adjusted"}
                </Text>
              </HStack>

              <ImageAdjustmentModal
                key={data}
                isOpen={isOpen}
                onClose={onClose}
                config={config}
                src={data}
                value={currentAdjustment}
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
        <FileAttachment
          maxSizeInBytes={schema.maxSizeInBytes ?? MAX_IMG_FILE_SIZE_BYTES}
          acceptedFileTypes={
            schema.allowedMimeTypeMappings ?? IMAGE_ACCEPTED_MIME_TYPE_MAPPING
          }
          siteId={siteId}
          resourceId={(pageId ?? linkId) ? String(pageId ?? linkId) : undefined}
          setHref={(src) => handleChange(path, src)}
          shouldFetchResource={true}
        />
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

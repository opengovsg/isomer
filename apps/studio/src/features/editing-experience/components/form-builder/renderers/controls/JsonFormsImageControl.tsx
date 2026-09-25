import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { AttachmentData } from "~/components/AttachmentData"
import { PLACEHOLDER_ALT_TEXT } from "~/components/PageEditor/constants"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useAiAltTextGenerationEnabled } from "~/hooks/useAiAltTextGenerationEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import { trpc } from "~/utils/trpc"

import {
  getCustomErrorMessage,
  getImageFieldPaths,
  getSurroundingText,
} from "./utils"

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
  const isAiAltTextGenerationEnabled = useAiAltTextGenerationEnabled(siteId)
  const ctx = useJsonForms()

  const { parentPath, altPath } = getImageFieldPaths(path)
  const parentData = get(ctx.core?.data, parentPath) as
    | Record<string, unknown>
    | undefined

  const { mutate: generateAltText } = trpc.ai.generateAltText.useMutation({
    onSuccess: ({ altText }) => {
      if (!altText || !altPath) return
      // The generation call takes a few seconds — don't clobber alt text the
      // editor already typed in while it was in flight. A new image block
      // starts with placeholder alt, and that should be replaced.
      const currentAlt = get(ctx.core?.data, altPath) as string | undefined
      if (currentAlt && currentAlt !== PLACEHOLDER_ALT_TEXT) return
      handleChange(altPath, altText)
    },
    onError: (error) => {
      // The upload already landed. A forbidden suggestion leaves the image as saved.
      if (error.data?.code === "FORBIDDEN") return
    },
  })

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>
      {data ? (
        <AttachmentData
          data={data.split("/").pop() ?? "Unknown"}
          onClick={() => handleChange(path, undefined)}
        />
      ) : (
        <FileAttachment
          maxSizeInBytes={schema.maxSizeInBytes ?? MAX_IMG_FILE_SIZE_BYTES}
          acceptedFileTypes={
            schema.allowedMimeTypeMappings ?? IMAGE_ACCEPTED_MIME_TYPE_MAPPING
          }
          siteId={siteId}
          resourceId={(pageId ?? linkId) ? String(pageId ?? linkId) : undefined}
          setHref={(src) => {
            handleChange(path, src)
            if (!isAiAltTextGenerationEnabled) {
              return
            }
            // Suggestions only apply on a page whose image field has a sibling alt.
            if (!pageId || !altPath) {
              return
            }
            // Skip the empty href FileAttachment sends while the upload is in flight.
            if (!src) {
              return
            }

            generateAltText({
              siteId,
              pageId,
              src,
              surroundingText: getSurroundingText(parentData),
            })
          }}
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

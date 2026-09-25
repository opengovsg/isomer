import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { AttachmentData } from "~/components/AttachmentData"
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
  const isAiAltTextGenerationEnabled = useAiAltTextGenerationEnabled()
  const ctx = useJsonForms()

  const { parentPath, altPath } = getImageFieldPaths(path)
  const parentData = get(ctx.core?.data, parentPath) as
    | Record<string, unknown>
    | undefined

  const { mutate: generateAltText } = trpc.ai.generateAltText.useMutation({
    onSuccess: ({ altText }) => {
      if (!altText || !altPath) return
      // The generation call takes a few seconds — don't clobber alt text the
      // editor already typed in while it was in flight.
      const currentAlt = get(ctx.core?.data, altPath) as string | undefined
      if (currentAlt) return
      handleChange(altPath, altText)
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
              componentType:
                typeof parentData?.type === "string"
                  ? parentData.type
                  : (schema.title ?? "image"),
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

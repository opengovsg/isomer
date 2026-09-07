import type { ControlProps, JsonSchema, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"
import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { useState } from "react"
import { AttachmentData } from "~/components/AttachmentData"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import { trpc } from "~/utils/trpc"

import { getCustomErrorMessage } from "./utils"

const SURROUNDING_TEXT_FIELD_DENYLIST = new Set(["src", "alt", "type"])

// The alt field is always the sibling of `src` on the same component object,
// e.g. "content.2.src" -> "content.2.alt".
const getSiblingAltPath = (srcPath: string): string | undefined => {
  const parts = srcPath.split(".")
  if (parts[parts.length - 1] !== "src") return undefined
  return [...parts.slice(0, -1), "alt"].join(".")
}

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
  const ctx = useJsonForms()
  const [uploadedMimeType, setUploadedMimeType] = useState<string>()

  const altPath = getSiblingAltPath(path)
  const parentPath = path.split(".").slice(0, -1).join(".")
  const parentData = get(ctx.core?.data, parentPath) as
    | Record<string, unknown>
    | undefined

  const { mutate: generateAltText } = trpc.image.generateAltText.useMutation({
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
          onUploadedFile={(file) => setUploadedMimeType(file.type)}
          setHref={(src) => {
            handleChange(path, src)
            if (!src || !pageId || !altPath || !uploadedMimeType) return

            const surroundingText = parentData
              ? Object.entries(parentData)
                  .filter(
                    ([key, value]) =>
                      !SURROUNDING_TEXT_FIELD_DENYLIST.has(key) &&
                      typeof value === "string" &&
                      value.trim().length > 0,
                  )
                  .map(([, value]) => value as string)
                  .join(" ")
              : undefined

            generateAltText({
              siteId,
              pageId,
              src,
              mimeType: uploadedMimeType,
              componentType:
                typeof parentData?.type === "string"
                  ? parentData.type
                  : (schema.title ?? "image"),
              surroundingText: surroundingText || undefined,
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

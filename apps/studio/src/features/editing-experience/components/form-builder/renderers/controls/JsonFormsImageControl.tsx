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
import { useAiAltTextGenerationEnabled } from "~/hooks/useAiAltTextGenerationEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import { trpc } from "~/utils/trpc"

import { AltTextSuggestion } from "./AltTextSuggestion"
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

  const [suggestion, setSuggestion] = useState<string>()
  const [hasAltTextFailed, setHasAltTextFailed] = useState(false)
  const { mutate: generateAltText, isPending: isGeneratingAltText } =
    trpc.ai.generateAltText.useMutation({
      onSuccess: ({ altText }) => {
        // A successful call can still return no text when the image cannot be
        // read or the model returns nothing. Treat that as a failed suggestion.
        setSuggestion(altText)
        setHasAltTextFailed(!altText)
      },
      onError: () => {
        setSuggestion(undefined)
        setHasAltTextFailed(true)
      },
    })

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>
      {data ? (
        <AttachmentData
          data={data.split("/").pop() ?? "Unknown"}
          onClick={() => {
            handleChange(path, undefined)
            setSuggestion(undefined)
            setHasAltTextFailed(false)
          }}
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

            setSuggestion(undefined)
            setHasAltTextFailed(false)
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
      <AltTextSuggestion
        isGenerating={isGeneratingAltText}
        suggestion={suggestion}
        hasFailed={hasAltTextFailed && !isGeneratingAltText}
        onApply={() => {
          if (!altPath || !suggestion) return
          handleChange(altPath, suggestion)
          setSuggestion(undefined)
          setHasAltTextFailed(false)
        }}
        onDismiss={() => {
          setSuggestion(undefined)
          setHasAltTextFailed(false)
        }}
      />
      {!!errors && (
        <FormErrorMessage>
          {label} {getCustomErrorMessage(errors)}
        </FormErrorMessage>
      )}
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)

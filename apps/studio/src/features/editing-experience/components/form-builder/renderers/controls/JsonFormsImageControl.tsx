import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"

import { AttachmentData } from "~/components/AttachmentData"
import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageOrLinkSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_IMG_FILE_SIZE_BYTES,
} from "./constants"
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
}
export function JsonFormsImageControl({
  label,
  handleChange,
  path,
  required,
  errors,
  description,
  data,
}: JsonFormsImageControlProps) {
  const { siteId, pageId, linkId } = useQueryParse(pageOrLinkSchema)

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
          maxSizeInBytes={MAX_IMG_FILE_SIZE_BYTES}
          acceptedFileTypes={IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING}
          siteId={siteId}
          resourceId={pageId ?? linkId ? String(pageId ?? linkId) : undefined}
          setHref={(src) => handleChange(path, src)}
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

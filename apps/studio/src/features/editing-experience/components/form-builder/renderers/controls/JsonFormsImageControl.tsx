import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormErrorMessage, FormLabel } from "@opengovsg/design-system-react"
import { z } from "zod"

import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { env } from "~/env.mjs"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useImage } from "../../hooks/useImage"
import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_IMG_FILE_SIZE_BYTES,
} from "./constants"
import { getCustomErrorMessage } from "./utils"

const assetsBaseUrl = `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "image"),
  ),
)

const editSiteSchema = z.object({
  siteId: z.coerce.number(),
})

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
}: JsonFormsImageControlProps) {
  const { siteId } = useQueryParse(editSiteSchema)
  const { handleImage } = useImage({})

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>
      <FileAttachment
        maxSizeInBytes={MAX_IMG_FILE_SIZE_BYTES}
        acceptedFileTypes={IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING}
        siteId={siteId}
        setHref={(src) =>
          src &&
          handleImage(`${assetsBaseUrl}${src}`).then((src) =>
            handleChange(path, src),
          )
        }
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

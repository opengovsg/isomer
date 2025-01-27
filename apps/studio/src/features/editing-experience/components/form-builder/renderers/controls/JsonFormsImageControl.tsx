import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, Flex, FormControl, IconButton, Text } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  FormErrorMessage,
  FormHelperText,
  FormLabel,
} from "@opengovsg/design-system-react"
import { BiTrash } from "react-icons/bi"
import { z } from "zod"

import { FileAttachment } from "~/components/PageEditor/FileAttachment"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useImage } from "../../hooks/useImage"
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
  data,
}: JsonFormsImageControlProps) {
  const { siteId } = useQueryParse(editSiteSchema)
  const { handleImage } = useImage({})

  return (
    <Box as={FormControl} isRequired={required} isInvalid={!!errors}>
      <FormLabel description={description}>{label}</FormLabel>
      {data ? (
        <Flex
          px="1rem"
          py="0.75rem"
          flexDir="row"
          background="brand.primary.100"
          justifyContent="space-between"
          alignItems="center"
        >
          <Text overflow="auto">{data.split("/").pop()}</Text>
          <IconButton
            size="xs"
            variant="clear"
            colorScheme="critical"
            aria-label="Remove file"
            icon={<BiTrash />}
            onClick={() => handleChange(path, undefined)}
          />
        </Flex>
      ) : (
        <FileAttachment
          maxSizeInBytes={MAX_IMG_FILE_SIZE_BYTES}
          acceptedFileTypes={IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING}
          siteId={siteId}
          setHref={(src) =>
            src && handleImage(src).then((src) => handleChange(path, src))
          }
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

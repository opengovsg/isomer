import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useState } from "react"
import { Box, FormControl, Text } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Attachment,
  FormErrorMessage,
  FormLabel,
  useToast,
} from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPES,
  MAX_IMG_FILE_SIZE_BYTES,
} from "./constants"

export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "image"),
  ),
)
export function JsonFormsImageControl({
  label,
  handleChange,
  path,
  description,
  required,
  errors,
}: ControlProps) {
  const toast = useToast()

  const [pendingFile, setPendingFile] = useState<File | undefined>()

  return (
    <Box py={2}>
      <FormControl isRequired={required} isInvalid={!pendingFile || !!errors}>
        <FormLabel description={description}>{label}</FormLabel>
        <Attachment
          isRequired={required}
          name="image-upload"
          imagePreview="large"
          multiple={false}
          value={pendingFile}
          onChange={(file) => {
            if (file) {
              setPendingFile(file)
              // TODO: Upload file logic?
              handleChange(path, "https://picsum.photos/id/237/200/300")
            } else {
              // NOTE: Do we need to update backend on removal of file?
              handleChange(path, "")
              setPendingFile(undefined)
            }
          }}
          onError={(error) => {
            toast({
              title: "Image error",
              description: error,
              status: "error",
            })
          }}
          onRejection={(rejections) => {
            if (rejections[0]?.errors[0]) {
              toast({
                title: "Image rejected",
                description: rejections[0].errors[0].message,
                status: "error",
              })
            }
          }}
          maxSize={MAX_IMG_FILE_SIZE_BYTES}
          accept={IMAGE_UPLOAD_ACCEPTED_MIME_TYPES}
        />
        <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
          {`Maximum file size: ${MAX_IMG_FILE_SIZE_BYTES / 1000000} MB`}
        </Text>
        {!!errors && (
          <FormErrorMessage>
            {label} {errors}
          </FormErrorMessage>
        )}
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)

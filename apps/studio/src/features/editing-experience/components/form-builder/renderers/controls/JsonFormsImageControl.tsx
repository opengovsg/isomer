import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { Box, FormControl, Text } from "@chakra-ui/react"
import {
  and,
  isBooleanControl,
  isEnabled,
  isStringControl,
  or,
  rankWith,
  schemaMatches,
  schemaTypeIs,
  scopeEndsWith,
  uiTypeIs,
} from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Attachment, FormLabel } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { trpc } from "~/utils/trpc"
import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPES,
  MAX_IMG_FILE_SIZE_BYTES,
} from "./constants"

export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(schemaMatches((schema) => schema.format === "image")),
)
export function JsonFormsImageControl({
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>()

  async function dataURLToFile(dataURL: string): Promise<File | undefined> {
    try {
      const response = await fetch(dataURL)
      const blob = await response.blob()
      const mimeType = response.headers.get("Content-Type") || ""

      return new File([blob], "Currently selected image", { type: mimeType })
    } catch (error) {
      return undefined
    }
  }

  trpc.page.readImageInPage.useQuery(
    {
      imageUrlInSchema: data,
    },
    {
      enabled: !!data,
      async onSettled(queryData, error) {
        if (!!error) {
          // handle fetch error
          console.log("image fetch error!")
        }
        if (!!queryData && !!queryData.imageDataURL) {
          // Convert dataURL to file
          // TODO: Figure out the CSP issue with feth
          console.log("RECIEVE IMAGE", queryData.imageDataURL)
          const file = await dataURLToFile(queryData.imageDataURL)
          if (!!file) {
            setSelectedFile(file)
          } else {
            console.log("Error setting selected file!")
          }
        }
      },
    },
  )

  return (
    <Box py={2}>
      <FormControl isRequired={required}>
        <FormLabel description={description}>{label}</FormLabel>
        <Attachment
          name="image-upload"
          imagePreview="large"
          multiple={false}
          value={selectedFile}
          onChange={(file) => {
            console.log(file?.name)
            if (file) {
              // TODO: file attached, upload file
              const newImgUrl = "https://picsum.photos/200/300"
              handleChange(path, newImgUrl)
              console.log("new url", newImgUrl)
            } else {
              handleChange(path, "")
            }
          }}
          onError={(error) => {
            console.log("file attachment error ", error)
          }}
          onRejection={(rejections) => {
            console.log(rejections)
          }}
          maxSize={MAX_IMG_FILE_SIZE_BYTES}
          accept={IMAGE_UPLOAD_ACCEPTED_MIME_TYPES}
        />
        <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
          {`Maximum file size: ${MAX_IMG_FILE_SIZE_BYTES / 1000000} MB`}``
        </Text>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)

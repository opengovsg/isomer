// don't use backend to render, proxy once on load, 3 states, cache locally till success
import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { Box, FormControl, Text } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Attachment, FormLabel } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { trpc } from "~/utils/trpc"
import {
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPES,
  MAX_IMG_FILE_SIZE_BYTES,
} from "./constants"
import { BlobToImageDataURL, imageDataURLToFile } from "./utils"

export const jsonFormsImageControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ImageControl,
  and(
    isStringControl,
    schemaMatches((schema) => schema.format === "image"),
  ),
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
  const [pendingFile, setPendingFile] = useState<File | undefined>()
  const [shouldFetchImage, setShouldFetchImage] = useState(false)

  useEffect(() => {
    if (!!data) {
      setShouldFetchImage(true)
    }
    // NOTE: Using empty dependency array because we are checking if fetch is needed only upon initial load.
    // After this load, we are the only editor of this page, and any image url changes are caused by us and we will be caching the file locally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // NOTE: Run once only if initial load has non empty data(imageURL).
  const uploadImageMutation = trpc.page.uploadImageGetURL.useMutation({
    onSettled(data, error) {
      if (!!error) {
        console.log("upload mutation error", error)
      } else {
        const newImgUrl = data?.uploadedImageURL
        setSelectedFile(pendingFile)
        handleChange(path, newImgUrl)
        console.log("new file url", newImgUrl)
      }
    },
  })
  trpc.page.readImageInPage.useQuery(
    {
      imageUrlInSchema: data as string,
    },
    {
      enabled: shouldFetchImage,
      onSettled(queryData, error) {
        if (!!error) {
          console.log("Image fetch error!")
        }
        if (!!queryData && !!queryData.imageDataURL) {
          const file = imageDataURLToFile(queryData.imageDataURL)
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
              setPendingFile(file)
              BlobToImageDataURL(file, file.type)
                .then((imageDataURL) => {
                  uploadImageMutation.mutate({ imageDataURL })
                })
                .catch((reason) =>
                  console.log("Error converting image to dataurl, ", reason),
                )
              // TODO: file attached, upload file. Below code could be in callback of upload TRPC call.
              // Upload succeeded, note the race condition that we could have removed the file while uploading it!
            } else {
              // NOTE: Do we need to update backend on removal of file?
              handleChange(path, "")
              setPendingFile(undefined)
              setSelectedFile(undefined)
            }
          }}
          onError={(error) => {
            console.log("File attachment error ", error)
          }}
          onRejection={(rejections) => {
            console.log(rejections)
          }}
          maxSize={MAX_IMG_FILE_SIZE_BYTES}
          accept={IMAGE_UPLOAD_ACCEPTED_MIME_TYPES}
        />
        <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
          {`Maximum file size: ${MAX_IMG_FILE_SIZE_BYTES / 1000000} MB`}
        </Text>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)

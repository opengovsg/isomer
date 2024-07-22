import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Box, FormControl, Text } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Attachment,
  FormErrorMessage,
  FormLabel,
} from "@opengovsg/design-system-react"
import wretch from "wretch"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { trpc } from "~/utils/trpc"
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
  data,
  label,
  handleChange,
  path,
  description,
  required,
}: ControlProps) {
  const { pageId, siteId } = useParams()

  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [pendingFile, setPendingFile] = useState<File | undefined>()
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!!data) {
      wretch(data as string)
        .get()
        .blob()
        .then((blob) => {
          const splitData = (data as string).split("/")
          const fileName = splitData[-1] || "Current Image"
          setSelectedFile(new File([blob], fileName))
        })
        .catch((error) => {
          console.log("error fetching initial image", error)
        })
    }
    // NOTE: Using empty dependency array because we are checking if fetch is needed only upon initial load.
    // After this load, we are the only editor of this page, and any image url changes are caused by us and we will be caching the file locally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const getPresignedMutation =
    trpc.page.getPresignUrlForImageUpload.useMutation()
  const uploadImage = async (image: File) => {
    const { presignedUploadURL, fileURL } =
      await getPresignedMutation.mutateAsync({
        pageId: Number(pageId),
        siteId: Number(siteId),
      })
    const response = await wretch(presignedUploadURL)
      .content(image.type)
      .put(image)
      .res()
    if (response.ok) {
      setSelectedFile(pendingFile)
      setErrorMessage("")
      handleChange(path, fileURL)
      console.log("new file url", fileURL)
    } else {
      setPendingFile(undefined)
      setErrorMessage(
        "There is an error uploading your file. Please try again or contact support.",
      )
      console.log("file upload failure", response)
    }
  }

  return (
    <Box py={2}>
      <FormControl isRequired={required} isInvalid={errorMessage !== ""}>
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
              void uploadImage(file)
            } else {
              // NOTE: Do we need to update backend on removal of file?
              handleChange(path, "")
              setPendingFile(undefined)
              setSelectedFile(undefined)
            }
          }}
          onError={(error) => {
            setErrorMessage("An error occured, please try again: " + error)
            console.log("File attachment error ", error)
          }}
          onRejection={(rejections) => {
            if (rejections[0]?.errors[0]) {
              setErrorMessage(rejections[0].errors[0].message)
            }
          }}
          maxSize={MAX_IMG_FILE_SIZE_BYTES}
          accept={IMAGE_UPLOAD_ACCEPTED_MIME_TYPES}
        />
        <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
          {`Maximum file size: ${MAX_IMG_FILE_SIZE_BYTES / 1000000} MB`}
        </Text>
        <FormErrorMessage>{errorMessage}</FormErrorMessage>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsImageControl)

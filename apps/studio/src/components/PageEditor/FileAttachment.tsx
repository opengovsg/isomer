import type { AttachmentProps } from "@opengovsg/design-system-react"
import { useEffect, useState } from "react"
import { FormControl, Skeleton, Text } from "@chakra-ui/react"
import { Attachment } from "@opengovsg/design-system-react"

import {
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_FILE_SIZE_BYTES,
} from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { getPresignedPutUrlSchema } from "~/schemas/asset"

interface FileAttachmentProps {
  setHref: (href?: string) => void
  siteId: number
  value?: File
}

type FileRejections = AttachmentProps<false>["rejections"]

const ACCEPTED_FILE_TYPES_MESSAGE = Object.keys(
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
).join(", ")

export const FileAttachment = ({
  setHref,
  siteId,
  value,
}: FileAttachmentProps) => {
  const [file, setFile] = useState<File | undefined>(value)
  const [rejections, setRejections] = useState<FileRejections>([])
  // TODO: Add a mutation for deletion next time of s3 resources
  const { mutate: uploadFile, isLoading } = useUploadAssetMutation({
    siteId,
  })

  useEffect(() => {
    // NOTE: The outer link modal uses this to disable the button
    if (isLoading) setHref("")
  }, [isLoading, setHref])

  return (
    <FormControl>
      <Skeleton isLoaded={!isLoading}>
        <Attachment
          isRequired
          name="file-upload"
          multiple={false}
          value={file}
          rejections={rejections}
          onRejection={setRejections}
          onChange={(file) => {
            setFile(file)
            if (!file) {
              setHref()
              return
            }

            uploadFile(
              { file },
              {
                onSuccess: ({ path }) => {
                  setHref(path)
                },
              },
            )
          }}
          maxSize={MAX_FILE_SIZE_BYTES}
          accept={Object.values(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING)}
          onFileValidation={(file) => {
            const parseResult = getPresignedPutUrlSchema
              .pick({ fileName: true })
              .safeParse({ fileName: file.name })

            if (parseResult.success) return null
            // NOTE: safe assertion here because we're in error path and there's at least 1 error
            return (
              parseResult.error.errors[0]?.message ||
              "Please ensure that your file begins with alphanumeric characters!"
            )
          }}
        />
      </Skeleton>
      <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
        {`Maximum file size: ${MAX_FILE_SIZE_BYTES / 1000000} MB`}
        <br />
        {`Accepted file types: ${ACCEPTED_FILE_TYPES_MESSAGE}`}
      </Text>
    </FormControl>
  )
}

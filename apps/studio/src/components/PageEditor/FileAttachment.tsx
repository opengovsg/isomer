import type { AttachmentProps } from "@opengovsg/design-system-react"
import { useEffect, useState } from "react"
import { FormControl, Skeleton, Text } from "@chakra-ui/react"
import { Attachment } from "@opengovsg/design-system-react"

import { useImageUpload } from "~/features/editing-experience/components/form-builder/hooks/useImage"
import {
  ACCEPTED_FILE_TYPES_MESSAGE,
  ONE_MB_IN_BYTES,
} from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { getPresignedPutUrlSchema } from "~/schemas/asset"

interface FileAttachmentProps {
  setHref: (href?: string) => void
  siteId: number
  value?: File
  maxSizeInBytes: number
  acceptedFileTypes: Record<string, string>
}

type FileRejections = AttachmentProps<false>["rejections"]

export const FileAttachment = ({
  setHref,
  siteId,
  maxSizeInBytes,
  acceptedFileTypes,
}: FileAttachmentProps) => {
  const [rejections, setRejections] = useState<FileRejections>([])
  // TODO: Add a mutation for deletion next time of s3 resources
  const { mutate: uploadFile } = useUploadAssetMutation({
    siteId,
  })
  const { handleImageUpload, isLoading } = useImageUpload({})

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
          value={undefined}
          rejections={rejections}
          onRejection={setRejections}
          onChange={(file) => {
            if (!file) {
              setHref()
              return
            }

            uploadFile(
              { file },
              {
                onSuccess: ({ path }) => {
                  void handleImageUpload(path).then((src) => setHref(src))
                },
              },
            )
          }}
          maxSize={maxSizeInBytes}
          accept={Object.values(acceptedFileTypes)}
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
        {`Maximum file size: ${maxSizeInBytes / ONE_MB_IN_BYTES} MB`}
        <br />
        {`Accepted file types: ${ACCEPTED_FILE_TYPES_MESSAGE}`}
      </Text>
    </FormControl>
  )
}

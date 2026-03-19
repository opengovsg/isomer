import type { AttachmentProps } from "@opengovsg/design-system-react"
import { useEffect, useState } from "react"
import { FormControl, Skeleton, Text } from "@chakra-ui/react"
import { Attachment } from "@opengovsg/design-system-react"
import uniq from "lodash/uniq"

import { useAssetUpload } from "~/features/editing-experience/components/form-builder/hooks/useAssetUpload"
import { ONE_MB_IN_BYTES } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { getPresignedPutUrlSchema } from "~/schemas/asset"

interface FileAttachmentProps {
  setHref: (href?: string) => void
  siteId: number
  resourceId?: string
  value?: File
  maxSizeInBytes: number
  acceptedFileTypes: Record<string, string>
  shouldFetchResource?: boolean
}

type FileRejections = AttachmentProps<false>["rejections"]

export const FileAttachment = ({
  setHref,
  siteId,
  resourceId,
  maxSizeInBytes,
  acceptedFileTypes,
  shouldFetchResource = true,
}: FileAttachmentProps) => {
  const [rejections, setRejections] = useState<FileRejections>([])
  // TODO: Add a mutation for deletion next time of s3 resources
  const { mutate: uploadFile } = useUploadAssetMutation({
    siteId,
    resourceId,
  })
  const { handleAssetUpload, isLoading } = useAssetUpload({})

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
              setHref(undefined)
              return
            }

            uploadFile(
              { file },
              {
                onSuccess: ({ path }) => {
                  if (shouldFetchResource) {
                    void handleAssetUpload(path).then((src) => setHref(src))
                  } else setHref(path)
                },
              },
            )
          }}
          maxSize={maxSizeInBytes}
          accept={uniq([
            ...Object.keys(acceptedFileTypes),
            ...Object.values(acceptedFileTypes),
          ])}
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
        {`Accepted file types: ${Object.keys(acceptedFileTypes).join(", ")}`}
      </Text>
    </FormControl>
  )
}

import { useEffect, useState } from "react"
import { FormControl, Skeleton } from "@chakra-ui/react"
import { Attachment } from "@opengovsg/design-system-react"

import { MAX_PDF_FILE_SIZE_BYTES } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { getPresignedPutUrlSchema } from "~/schemas/asset"

interface FileAttachmentProps {
  setHref: (href: string) => void
  setError: (error: string) => void
  clearError: () => void
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  setHref,
  setError,
  clearError,
}: FileAttachmentProps) => {
  const { siteId } = useQueryParse(editPageSchema)

  const [file, setFile] = useState<File | undefined>(undefined)

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
          onChange={(file) => {
            setFile(file)
            if (!file) {
              setHref("")
              setError("Please make sure you upload a file!")
              return
            }

            uploadFile(
              { file },
              {
                onSuccess: ({ path }) => {
                  setHref(path)
                  clearError()
                },
              },
            )
          }}
          onError={setError}
          maxSize={MAX_PDF_FILE_SIZE_BYTES}
          showFileSize
          accept={["application/pdf"]}
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
    </FormControl>
  )
}

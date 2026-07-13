import type { AttachmentProps } from "@opengovsg/design-system-react"
import { FormControl, Skeleton, Text } from "@chakra-ui/react"
import { Attachment, useToast } from "@opengovsg/design-system-react"
import { uniq } from "lodash-es"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useAssetUpload } from "~/features/editing-experience/components/form-builder/hooks/useAssetUpload"
import { RISKY_FILE_EXTENSIONS } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { getPresignedPutUrlSchema, uploadSvgSchema } from "~/schemas/asset"
import { formatFileSizeLimit } from "~/utils/formatFileSizeLimit"
import { getFileExtension } from "~/utils/getFileExtension"

const RiskyFileUploadModal = dynamic(() =>
  import("./RiskyFileUploadModal").then((mod) => mod.RiskyFileUploadModal),
)

interface FileAttachmentProps {
  setHref: (href?: string) => void
  siteId: number
  resourceId?: string
  value?: File
  maxSizeInBytes: number
  acceptedFileTypes: Record<string, string>
  shouldFetchResource?: boolean
  onUploadedFile?: (file: File) => void
  enableRiskyFileWarning?: boolean
}

type FileRejections = AttachmentProps<false>["rejections"]

export const FileAttachment = ({
  setHref,
  siteId,
  resourceId,
  maxSizeInBytes,
  acceptedFileTypes,
  shouldFetchResource = true,
  onUploadedFile,
  enableRiskyFileWarning = false,
}: FileAttachmentProps) => {
  const [rejections, setRejections] = useState<FileRejections>([])
  const [pendingAckRiskyFile, setPendingAckRiskyFile] = useState<File | null>(
    null,
  )
  // TODO: Add a mutation for deletion next time of s3 resources
  const { mutate: uploadFile } = useUploadAssetMutation({
    siteId,
    resourceId,
  })
  const { handleAssetUpload, isLoading } = useAssetUpload({})
  const toast = useToast()

  useEffect(() => {
    // NOTE: The outer link modal uses this to disable the button
    if (isLoading) setHref("")
  }, [isLoading, setHref])

  const doUpload = (file: File) => {
    uploadFile(
      { file },
      {
        onSuccess: ({ path }) => {
          onUploadedFile?.(file)
          if (shouldFetchResource) {
            void handleAssetUpload(path)
              .then((src) => setHref(src))
              .catch(() => {
                toast({
                  title: "Failed to upload file",
                  description: "Please try again.",
                  status: "error",
                  ...BRIEF_TOAST_SETTINGS,
                })
              })
          } else setHref(path)
        },
      },
    )
  }

  return (
    <>
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

              const ext = getFileExtension(file.name)
              if (enableRiskyFileWarning && RISKY_FILE_EXTENSIONS.has(ext)) {
                setPendingAckRiskyFile(file)
                return
              }

              doUpload(file)
            }}
            maxSize={maxSizeInBytes}
            accept={uniq([
              ...Object.keys(acceptedFileTypes),
              ...Object.values(acceptedFileTypes),
            ])}
            onFileValidation={(file) => {
              // SVGs are validated and uploaded via the dedicated uploadSvg
              // endpoint (not the presigned PUT path), so use uploadSvgSchema
              // for filename validation to avoid the deliberate SVG rejection
              // in getPresignedPutUrlSchema.
              const isSvg = file.name.toLowerCase().endsWith(".svg")
              const schema = isSvg
                ? uploadSvgSchema.pick({ fileName: true })
                : getPresignedPutUrlSchema.pick({ fileName: true })
              const parseResult = schema.safeParse({ fileName: file.name })

              if (parseResult.success) return null
              // NOTE: safe assertion here because we're in error path and there's at least 1 error
              return (
                parseResult.error.issues[0]?.message ||
                "Please ensure that your file begins with alphanumeric characters!"
              )
            }}
          />
        </Skeleton>
        <Text textStyle="body-2" textColor="base.content.medium" pt="0.5rem">
          {`Maximum file size: ${formatFileSizeLimit({ bytes: maxSizeInBytes })}`}
          <br />
          {`Accepted file types: ${Object.keys(acceptedFileTypes).join(", ")}`}
        </Text>
      </FormControl>

      {enableRiskyFileWarning && pendingAckRiskyFile && (
        <RiskyFileUploadModal
          isOpen={!!pendingAckRiskyFile}
          file={pendingAckRiskyFile}
          onConfirm={() => doUpload(pendingAckRiskyFile)}
          onClose={() => setPendingAckRiskyFile(null)}
        />
      )}
    </>
  )
}

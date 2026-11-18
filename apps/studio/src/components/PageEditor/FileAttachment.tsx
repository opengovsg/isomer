import type { AttachmentProps } from "@opengovsg/design-system-react"
import { Box, FormControl, Skeleton, Text } from "@chakra-ui/react"
import { Attachment, useToast } from "@opengovsg/design-system-react"
import { uniq } from "lodash-es"
import dynamic from "next/dynamic"
import { forwardRef, useState } from "react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { RISKY_FILE_EXTENSIONS } from "~/lib/fileUpload"
import { fileNameAndSizeSchema, uploadSvgSchema } from "~/schemas/asset"
import { formatFileSizeLimit } from "~/utils/formatFileSizeLimit"
import { getFileExtension } from "~/utils/getFileExtension"

const RiskyFileUploadModal = dynamic(() =>
  import("./RiskyFileUploadModal").then((mod) => mod.RiskyFileUploadModal),
)

interface FileAttachmentProps {
  setHref: (href?: string) => void
  siteId: number
  resourceId?: string
  maxSizeInBytes: number
  acceptedFileTypes: Record<string, string>
  isLoading?: boolean
  onUploadedFile?: (file: File) => void
  enableRiskyFileWarning?: boolean
  // Fired once the file has landed in S3; callers decide what to track.
  onUploadSuccess?: () => void
}

type FileRejections = AttachmentProps<false>["rejections"]

// The ref points at a wrapper so callers (e.g. a "Replace image" link) can open
// the file picker and reuse this upload flow; Attachment's type exposes no ref.
export const FileAttachment = forwardRef<HTMLDivElement, FileAttachmentProps>(
  (
    {
      setHref,
      siteId,
      resourceId,
      maxSizeInBytes,
      acceptedFileTypes,
      isLoading = false,
      onUploadedFile,
      enableRiskyFileWarning = false,
      onUploadSuccess,
    },
    ref,
  ) => {
    const [rejections, setRejections] = useState<FileRejections>([])
    const [pendingAckRiskyFile, setPendingAckRiskyFile] = useState<File | null>(
      null,
    )
    // TODO: Add a mutation for deletion next time of s3 resources
    const { mutate: uploadFile } = useUploadAssetMutation({
      siteId,
      resourceId,
    })
    const toast = useToast()

    const doUpload = (file: File) => {
      uploadFile(
        { file },
        {
          onSuccess: ({ path }) => {
            onUploadedFile?.(file)
            onUploadSuccess?.()
            setHref(path)
          },
          // Otherwise a failed presign or S3 PUT reverts the control silently.
          onError: (error) => {
            console.error("Failed to upload file", error)
            toast({
              title: "Failed to upload file",
              description:
                error instanceof Error ? error.message : "Please try again.",
              status: "error",
              ...BRIEF_TOAST_SETTINGS,
            })
          },
        },
      )
    }

    return (
      <Box ref={ref}>
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
                // in fileNameAndSizeSchema.
                const isSvg = file.name.toLowerCase().endsWith(".svg")
                const parseResult = isSvg
                  ? uploadSvgSchema
                      .pick({ fileName: true })
                      .safeParse({ fileName: file.name })
                  : fileNameAndSizeSchema.safeParse({
                      fileName: file.name,
                      fileSize: file.size,
                    })

                if (parseResult.success) return null
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
            isOpen
            file={pendingAckRiskyFile}
            onConfirm={() => doUpload(pendingAckRiskyFile)}
            onClose={() => setPendingAckRiskyFile(null)}
          />
        )}
      </Box>
    )
  },
)
FileAttachment.displayName = "FileAttachment"

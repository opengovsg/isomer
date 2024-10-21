import type { ControlProps, RankedTester } from "@jsonforms/core"
import { useEffect, useState } from "react"
import { Box, FormControl } from "@chakra-ui/react"
import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import {
  Attachment,
  FormErrorMessage,
  FormLabel,
  useToast,
} from "@opengovsg/design-system-react"

import type { ModifiedAsset } from "~/types/assets"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useEnv } from "~/hooks/useEnv"
import { getPresignedPutUrlSchema } from "~/schemas/asset"
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
  data,
}: ControlProps) {
  const {
    env: { NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME },
  } = useEnv()
  const toast = useToast()
  const { modifiedAssets, setModifiedAssets } = useEditorDrawerContext()
  const [pendingAsset, setPendingAsset] = useState<ModifiedAsset | undefined>()

  // NOTE: For some reason, we cannot modify the modifiedAssets state directly
  // from the Attachment component
  useEffect(() => {
    const modifiedAsset = modifiedAssets.find((image) => image.path === path)

    if (modifiedAsset) {
      modifiedAsset.file = pendingAsset?.file
      modifiedAsset.blobUrl = pendingAsset?.blobUrl
    } else if (pendingAsset !== undefined) {
      setModifiedAssets([...modifiedAssets, { ...pendingAsset }])
    }
  }, [modifiedAssets, path, pendingAsset, setModifiedAssets])

  useEffect(() => {
    const urlToFile = async (
      url: string,
      filename: string,
      mimeType: string,
    ) => {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        return new File([blob], filename, { type: mimeType })
      } catch {
        // File might not be ready yet, provide a fallback
        // TODO: Fetch the metadata directly from S3 instead
        return new File([], filename, { type: mimeType })
      }
    }

    async function convertImage(url: string) {
      const fileName = url.split("/").pop()
      const fileType = `image/${url.split(".").pop()}`
      const imageUrl = url.startsWith("/")
        ? `https://${NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}${url}`
        : url
      const file = await urlToFile(imageUrl, fileName || "", fileType)
      setPendingAsset({ path, src: url, file })
    }

    if (!data) {
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    convertImage(String(data))
    // NOTE: We only want to run this once if there is initial data provided
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box mt="1.25rem" _first={{ mt: 0 }}>
      <FormControl isRequired={required} isInvalid={!!errors}>
        <FormLabel description={description}>{label}</FormLabel>
        <Attachment
          isRequired={required}
          name="image-upload"
          multiple={false}
          value={pendingAsset?.file}
          onChange={(file) => {
            if (file) {
              const modifiedAsset: ModifiedAsset = {
                path,
                src: pendingAsset?.src,
                file,
                blobUrl: URL.createObjectURL(file),
              }

              setPendingAsset(modifiedAsset)
              handleChange(path, modifiedAsset.blobUrl)
            } else {
              handleChange(path, undefined)

              if (pendingAsset === undefined) {
                return
              }

              if (pendingAsset.blobUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(pendingAsset.blobUrl)
              }

              setPendingAsset({
                ...pendingAsset,
                file: undefined,
                blobUrl: undefined,
              })
            }
          }}
          onError={(error) => {
            toast({
              title: "Image error",
              description: error,
              status: "error",
            })
          }}
          maxSize={MAX_IMG_FILE_SIZE_BYTES}
          showFileSize
          accept={IMAGE_UPLOAD_ACCEPTED_MIME_TYPES}
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

import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { useMutation } from "@tanstack/react-query"
import { trpc } from "~/utils/trpc"

type UploadAssetMutationParams = Pick<
  z.infer<typeof getPresignedPutUrlSchema>,
  "siteId" | "resourceId"
>

export interface UploadAssetMutationInput {
  file: File
}

export interface UploadAssetMutationOutput {
  path: string
}

interface HandleUploadParams {
  file: File
  presignedPutUrl: string
  contentType: string
  contentDisposition: string
}

const handleUpload = async ({
  file,
  presignedPutUrl,
  contentType,
  contentDisposition,
}: HandleUploadParams) => {
  // Use server-signed Content-Type and Content-Disposition so upload metadata
  // cannot be overridden by the client (prevents stored XSS via type confusion).
  const response = await fetch(presignedPutUrl, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition,
    },
    method: "PUT",
    body: file,
  })

  if (!response.ok) {
    const data = (await response.json()) as unknown as { error: string }
    throw new Error(data.error)
  }
}

export const useUploadAssetMutation = ({
  siteId,
  resourceId,
}: UploadAssetMutationParams) => {
  const { mutateAsync: getPresignedPutUrl } =
    trpc.asset.getPresignedPutUrl.useMutation()

  return useMutation<UploadAssetMutationOutput, void, UploadAssetMutationInput>(
    {
      mutationFn: async ({ file }) => {
        const { fileKey, presignedPutUrl, contentType, contentDisposition } =
          await getPresignedPutUrl({
            siteId,
            resourceId,
            fileName: file.name,
          })
        await handleUpload({
          file,
          presignedPutUrl,
          contentType,
          contentDisposition,
        })

        return {
          path: `/${fileKey}`,
        }
      },
      retry: false,
    },
  )
}

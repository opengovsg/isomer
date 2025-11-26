import type { z } from "zod"
import { useMutation } from "@tanstack/react-query"

import type { getPresignedPutUrlSchema } from "~/schemas/asset"
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
}

const handleUpload = async ({ file, presignedPutUrl }: HandleUploadParams) => {
  // Encode filename for Content-Disposition header (RFC 6266)
  // Escape quotes and backslashes, then use filename* parameter for UTF-8 support
  const encodedFilename = encodeURIComponent(file.name)

  const response = await fetch(presignedPutUrl, {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `inline; filename*=UTF-8''${encodedFilename}`,
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
        const { fileKey, presignedPutUrl } = await getPresignedPutUrl({
          siteId,
          resourceId,
          fileName: file.name,
        })
        await handleUpload({ file, presignedPutUrl })

        return {
          path: `/${fileKey}`,
        }
      },
      retry: false,
    },
  )
}

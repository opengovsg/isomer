import type { z } from "zod"
import { useMutation } from "@tanstack/react-query"

import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { trpc } from "~/utils/trpc"

type UploadAssetMutationParams = Pick<
  z.infer<typeof getPresignedPutUrlSchema>,
  "siteId"
>

interface UploadAssetMutationInput {
  file: File
}

interface UploadAssetMutationOutput {
  path: string
}

interface HandleUploadParams {
  file: File
  presignedPutUrl: string
}

const handleUpload = async ({ file, presignedPutUrl }: HandleUploadParams) => {
  const response = await fetch(presignedPutUrl, {
    headers: {
      "Content-Type": file.type,
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
}: UploadAssetMutationParams) => {
  const { mutateAsync: getPresignedPutUrl } =
    trpc.asset.getPresignedPutUrl.useMutation()

  return useMutation<UploadAssetMutationOutput, void, UploadAssetMutationInput>(
    async ({ file }) => {
      const { fileKey, presignedPutUrl } = await getPresignedPutUrl({
        siteId,
        fileName: file.name,
      })
      await handleUpload({ file, presignedPutUrl })

      return {
        path: fileKey,
      }
    },
    {
      retry: false,
    },
  )
}

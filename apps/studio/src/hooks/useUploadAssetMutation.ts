import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { useMutation } from "@tanstack/react-query"
import { performUpload } from "~/lib/storage/client"
import { trpc } from "~/utils/trpc"

type UploadAssetMutationParams = Pick<
  z.infer<typeof getPresignedPutUrlSchema>,
  "siteId" | "resourceId"
>

export interface UploadAssetMutationInput {
  file: File
  fileName?: string
  scheduledAt?: Date
}

export interface UploadAssetMutationOutput {
  path: string
}

export const useUploadAssetMutation = ({
  siteId,
  resourceId,
}: UploadAssetMutationParams) => {
  const { mutateAsync: getPresignedPutUrl } =
    trpc.asset.getPresignedPutUrl.useMutation()

  return useMutation<UploadAssetMutationOutput, void, UploadAssetMutationInput>(
    {
      mutationFn: async ({ file, fileName, scheduledAt }) => {
        const { fileKey, uploadConfig } = await getPresignedPutUrl({
          siteId,
          resourceId,
          fileName: fileName ?? file.name,
          tags: scheduledAt
            ? [
                {
                  key: "scheduledAt",
                  value: scheduledAt.getTime().toString(),
                },
              ]
            : undefined,
        })

        const path = await performUpload(file, fileKey, uploadConfig)
        return { path }
      },
      retry: false,
    },
  )
}

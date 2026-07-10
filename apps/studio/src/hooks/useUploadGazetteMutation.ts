import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/gazette"
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
  year: number
  category: string
  subcategory: string
}

export interface UploadAssetMutationOutput {
  path: string
}

// NOTE: Separate from `useUploadAssetMutation` because we upload to a
// different bucket with a different file path, via a different tRPC router
export const useUploadGazetteMutation = ({
  siteId,
  resourceId,
}: UploadAssetMutationParams) => {
  const { mutateAsync: getPresignedPutUrl } =
    trpc.gazette.getPresignedPutUrl.useMutation()

  return useMutation<UploadAssetMutationOutput, void, UploadAssetMutationInput>(
    {
      mutationFn: async ({
        file,
        fileName,
        scheduledAt,
        year,
        category,
        subcategory,
      }) => {
        const { fileKey, presignedPutUrl, contentType, contentDisposition } =
          await getPresignedPutUrl({
            siteId,
            resourceId,
            fileName: fileName ?? file.name,
            year,
            category,
            subcategory,
            tags: scheduledAt
              ? [
                  {
                    key: "scheduledAt",
                    value: scheduledAt.getTime().toString(),
                  },
                ]
              : undefined,
          })
        const path = await performUpload(file, fileKey, {
          presignedPutUrl,
          contentType,
          contentDisposition,
        })

        return { path }
      },
      retry: false,
    },
  )
}

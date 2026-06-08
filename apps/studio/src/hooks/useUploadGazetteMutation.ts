import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/gazette"
import { useMutation } from "@tanstack/react-query"
import { trpc } from "~/utils/trpc"

import { handleAssetUpload } from "./handleAssetUpload"

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

// NOTE: Duplicated from `useUploadAssetMutation` but we have a separate one
// because we want to upload in a different bucket as well as with different file path
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
        await handleAssetUpload({
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

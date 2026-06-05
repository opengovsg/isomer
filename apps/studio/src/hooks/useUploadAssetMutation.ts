import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { useMutation } from "@tanstack/react-query"
import { upload } from "@vercel/blob/client"
import { env } from "~/env.mjs"
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
        const { fileKey, contentType, contentDisposition, presignedPutUrl } =
          await getPresignedPutUrl({
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

        if (env.NEXT_PUBLIC_APP_ENV === "preview") {
          const blob = await upload(fileKey, file, {
            access: "public",
            handleUploadUrl: "/api/blob/upload",
            contentType,
          })
          return { path: blob.url }
        }

        await handleAssetUpload({
          file,
          presignedPutUrl,
          contentType,
          contentDisposition,
        })
        return { path: `/${fileKey}` }
      },
      retry: false,
    },
  )
}

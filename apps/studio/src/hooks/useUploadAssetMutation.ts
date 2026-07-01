import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
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
  const { mutateAsync: uploadSvg } = trpc.asset.uploadSvg.useMutation()

  return useMutation<UploadAssetMutationOutput, void, UploadAssetMutationInput>(
    {
      mutationFn: async ({ file, fileName, scheduledAt }) => {
        const effectiveName = fileName ?? file.name

        if (effectiveName.toLowerCase().endsWith(".svg")) {
          const content = await file.text()
          const { fileKey } = await uploadSvg({
            siteId,
            resourceId,
            fileName: effectiveName,
            content,
            tags: scheduledAt
              ? [
                  {
                    key: "scheduledAt",
                    value: scheduledAt.getTime().toString(),
                  },
                ]
              : undefined,
          })
          return { path: `/${fileKey}` }
        }

        const { fileKey, presignedPutUrl, contentType, contentDisposition } =
          await getPresignedPutUrl({
            siteId,
            resourceId,
            fileName: effectiveName,
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

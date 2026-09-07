/* oxlint-disable typescript/no-unsafe-argument, typescript/no-unsafe-assignment, typescript/no-invalid-void-type -- studio lint cleanup */
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
  const { mutateAsync: uploadSvg } = trpc.asset.uploadSvg.useMutation()

  return useMutation<UploadAssetMutationOutput, void, UploadAssetMutationInput>(
    {
      mutationFn: async ({ file, fileName, scheduledAt }) => {
        const effectiveName = fileName ?? file.name

        if (effectiveName.toLowerCase().endsWith(".svg")) {
          const content = await file.text()
          const { fileKey } = await uploadSvg({
            content,
            fileName: effectiveName,
            resourceId,
            siteId,
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

        const { fileKey, uploadConfig } = await getPresignedPutUrl({
          fileName: effectiveName,
          fileSize: file.size,
          resourceId,
          siteId,
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

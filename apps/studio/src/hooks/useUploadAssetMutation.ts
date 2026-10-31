import type { z } from "zod"
import type { getPresignedPutUrlSchema } from "~/schemas/asset"
import { useMutation } from "@tanstack/react-query"
import { reportClientError } from "~/lib/datadogError"
import { performUpload } from "~/lib/storage/client"
import { getFileExtension } from "~/utils/getFileExtension"
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

        const { fileKey, uploadConfig } = await getPresignedPutUrl({
          siteId,
          resourceId,
          fileName: effectiveName,
          fileSize: file.size,
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
      // Defined on the mutation itself (not passed to `.mutate()`) so this
      // still fires for failures that reject after the calling component has
      // unmounted, e.g. the hero banner/complex editor drawers that queue
      // this mutation and can close before a presign/S3 call settles
      // (ISOM-2680).
      onError: (error, { file }) => {
        reportClientError(error, {
          feature: "asset-upload",
          siteId,
          resourceId,
          fileExtension: getFileExtension(file.name),
          fileSize: file.size,
        })
      },
      retry: false,
    },
  )
}

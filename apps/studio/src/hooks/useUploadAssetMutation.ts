import type { SiteWideAssetSource } from "~/schemas/asset"
import { useMutation } from "@tanstack/react-query"
import { performUpload } from "~/lib/storage/client"
import { trpc } from "~/utils/trpc"

// Every upload must name what it is for, so the server can link the asset
export type UploadLinkTarget =
  | { resourceId: string }
  | { source: SiteWideAssetSource }

interface UploadAssetMutationParams {
  siteId: number
  target: UploadLinkTarget
}

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
  target,
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
            ...target,
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
          ...target,
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
      retry: false,
    },
  )
}

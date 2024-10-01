import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import set from "lodash/set"

import type {
  UploadAssetMutationInput,
  UploadAssetMutationOutput,
} from "~/hooks/useUploadAssetMutation"
import type { ModifiedAsset } from "~/types/assets"
import { PLACEHOLDER_IMAGE_FILENAME } from "./constants"

export const generateResourceUrl = (value: string) => {
  return (
    value
      .toLowerCase()
      // Replace non-alphanum characters with hyphen for UX
      .replace(/[^a-z0-9]/g, "-")
  )
}

interface UploadModifiedAssetsParams {
  block: IsomerComponent
  modifiedAssets: ModifiedAsset[]
  uploadAsset: UseMutateAsyncFunction<
    UploadAssetMutationOutput,
    void,
    UploadAssetMutationInput,
    unknown
  >
  onSuccess: (block: IsomerComponent) => void
  onError: (failedUploads: ModifiedAsset[]) => void
}

export const uploadModifiedAssets = async ({
  block,
  modifiedAssets,
  uploadAsset,
  onSuccess,
  onError,
}: UploadModifiedAssetsParams) => {
  // Upload all new/modified images/files
  const assetsToUpload = modifiedAssets.filter(
    (asset) => !!asset.file && asset.file.name !== PLACEHOLDER_IMAGE_FILENAME,
  )

  return Promise.allSettled(
    assetsToUpload.map(({ path, file }) => {
      if (!file) {
        return
      }

      return uploadAsset({ file }).then((res) => {
        set(block, path, res.path)
        return path
      })
    }),
  ).then((results) => {
    // Keep only failed uploads inside modifiedAssets so on subsequent
    // save attempts, we retry uploading just the failed assets
    const newModifiedAssets = modifiedAssets
      .filter(({ file }) => !!file && file.name !== PLACEHOLDER_IMAGE_FILENAME)
      .filter(({ path }) => {
        return !results.some(
          (result) => result.status === "fulfilled" && result.value === path,
        )
      })

    if (newModifiedAssets.length > 0) {
      onError(newModifiedAssets)
      return false
    }

    onSuccess(block)
    return true
  })
}

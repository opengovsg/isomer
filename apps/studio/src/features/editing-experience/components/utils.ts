import type {
  IsomerComponent,
  IsomerGeneratedSiteProps,
} from "@opengovsg/isomer-components"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import {
  FORMSG_EMBED_URL_REGEXES,
  MAPS_EMBED_URL_REGEXES,
  VIDEO_EMBED_URL_REGEXES,
} from "@opengovsg/isomer-components"
import DOMPurify from "isomorphic-dompurify"
import set from "lodash/set"

import type collectionSitemap from "~/features/editing-experience/data/collectionSitemap.json"
import type {
  UploadAssetMutationInput,
  UploadAssetMutationOutput,
} from "~/hooks/useUploadAssetMutation"
import type { ModifiedAsset } from "~/types/assets"
import { PLACEHOLDER_IMAGE_FILENAME } from "./constants"

export const EMBED_NAME_MAPPING: Record<
  | keyof typeof MAPS_EMBED_URL_REGEXES
  | keyof typeof VIDEO_EMBED_URL_REGEXES
  | keyof typeof FORMSG_EMBED_URL_REGEXES,
  string
> = {
  googlemaps: "Google Map",
  onemap: "OneMap",
  ogpmaps: "Maps.gov.sg",
  fbvideo: "Facebook Video",
  youtube: "YouTube",
  vimeo: "Vimeo",
  formsg: "FormSG",
}

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

export const generatePreviewSitemap = (
  sitemap: typeof collectionSitemap,
  title = "Your filename",
) => {
  return {
    ...sitemap,
    children: sitemap.children.map(({ children, ...rest }) => ({
      ...rest,
      children: children.map((props) => ({ ...props, title })),
    })),
  } as IsomerGeneratedSiteProps["siteMap"]
}

export const getIframeSrc = (embedCode: string): string | undefined => {
  const elem = DOMPurify.sanitize(embedCode, {
    ALLOWED_TAGS: ["iframe"],
    RETURN_DOM_FRAGMENT: true,
  })
  const sanitizedUrl = elem.firstElementChild?.getAttribute("src")

  return sanitizedUrl ?? undefined
}

export const getEmbedNameFromUrl = (url: string) =>
  Object.entries({
    ...MAPS_EMBED_URL_REGEXES,
    ...VIDEO_EMBED_URL_REGEXES,
    ...FORMSG_EMBED_URL_REGEXES,
  }).reduce<string | undefined>((acc, curr) => {
    if (acc) {
      // Embed name already found, return it
      return acc
    }

    const [embedName, regex] = curr
    if (new RegExp(regex).test(url)) {
      return EMBED_NAME_MAPPING[embedName as keyof typeof EMBED_NAME_MAPPING]
    }

    return undefined
  }, undefined)

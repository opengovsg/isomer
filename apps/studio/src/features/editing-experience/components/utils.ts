/* oxlint-disable eslint/array-callback-return, typescript/consistent-return -- core cleanup deferred */
import type {
  IsomerComponent,
  IsomerGeneratedSiteProps,
} from "@opengovsg/isomer-components"
import type { UseMutateAsyncFunction } from "@tanstack/react-query"
import type collectionSitemap from "~/features/editing-experience/data/collectionSitemap.json"
import type {
  UploadAssetMutationInput,
  UploadAssetMutationOutput,
} from "~/hooks/useUploadAssetMutation"
import type { ModifiedAsset } from "~/types/assets"
import {
  FORMSG_EMBED_URL_REGEXES,
  MAPS_EMBED_URL_REGEXES,
  VIDEO_EMBED_URL_REGEXES,
} from "@opengovsg/isomer-components"
import DOMPurify from "isomorphic-dompurify"
import { set } from "lodash-es"
import { transliterate } from "transliteration"

import { PLACEHOLDER_IMAGE_FILENAME } from "./constants"

export const EMBED_NAME_MAPPING = {
  fbvideo: "Facebook Video",
  formsg: "FormSG",
  googlemaps: "Google Map",
  ogpmaps: "Maps.gov.sg",
  onemap: "OneMap",
  vimeo: "Vimeo",
  youtube: "YouTube",
} satisfies Record<keyof typeof MAPS_EMBED_URL_REGEXES, string>

export const generateResourceUrl = (value: string): string =>
  transliterate(value)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]/gu, "-")

interface UploadModifiedAssetsParams {
  block: IsomerComponent
  modifiedAssets: ModifiedAsset[]
  uploadAsset: UseMutateAsyncFunction<
    UploadAssetMutationOutput,
    void,
    UploadAssetMutationInput
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
  return await Promise.allSettled(
    assetsToUpload.map(async ({ path, file }) => {
      if (!file) {
        return
      }

      // oxlint-disable-next-line typescript/consistent-return -- core cleanup deferred
      return await uploadAsset({ file }).then((res) => {
        set(block, path, res.path)
        return path
      })
    }),
  ).then((results) => {
    // Keep only failed uploads inside modifiedAssets so on subsequent
    // save attempts, we retry uploading just the failed assets
    const newModifiedAssets = modifiedAssets.filter(({ file, path }) => {
      if (!file || file.name === PLACEHOLDER_IMAGE_FILENAME) {
        return false
      }

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
) =>
  // SAFETY: preview sitemap children are mapped from the collection fixture shape
  // oxlint-disable-next-line unicorn/no-unsafe-type-assertion -- core cleanup deferred
  ({
    ...sitemap,
    children: sitemap.children.map(({ children, ...rest }) => ({
      ...rest,
      children: children.map((props) => ({ ...props, title })),
    })),
  }) as IsomerGeneratedSiteProps["siteMap"]

export const getIframeSrc = (embedCode: string): string | undefined => {
  // oxlint-disable-next-line import/no-named-as-default-member -- core cleanup deferred
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
    // oxlint-disable-next-line eslint/array-callback-return -- core cleanup deferred
    // oxlint-disable-next-line unicorn/no-array-reduce -- core cleanup deferred
  }).reduce<string | undefined>((acc, curr) => {
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- core cleanup deferred
    if (acc) {
      // Embed name already found, return it
      return acc
    }

    const [embedName, regex] = curr
    if (new RegExp(regex, "u").test(url)) {
      // SAFETY: caller invariant is checked immediately before this narrowing assertion
      // oxlint-disable-next-line unicorn/no-unsafe-type-assertion -- core cleanup deferred
      return EMBED_NAME_MAPPING[embedName as keyof typeof EMBED_NAME_MAPPING]
    }

    // oxlint-disable-next-line typescript/consistent-return -- core cleanup deferred
    // oxlint-disable-next-line eslint/no-useless-return -- core cleanup deferred
    return
  })

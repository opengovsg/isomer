// An image src is adjustable only if it's a managed site-storage asset for this
// site — a "/{siteId}/..." path. Uploads are stored that way (see getFileKey /
// useUploadAssetMutation: "/${siteId}/folder/file"), and only that path has a
// derivable bake key. This deliberately excludes:
//   - external/absolute URLs (no leading "/{siteId}/"), and
//   - the built-in placeholder "/placeholder_no_image.png" (starts with "/" but
//     is not a site asset) — a freshly-added block carries this until an image
//     is uploaded, and it must not offer "Adjust image".
// so the entry point stays hidden rather than letting a later Save/bake fail.
export const isManagedSiteAsset = (
  src: string | undefined,
  siteId: number,
): boolean => !!src && src.startsWith(`/${siteId}/`)

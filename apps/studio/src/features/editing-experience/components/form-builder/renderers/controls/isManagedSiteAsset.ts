import { PLACEHOLDER_IMAGE_FILENAME } from "~/features/editing-experience/components/constants"

// The built-in placeholder src a freshly-added image-bearing block carries until
// a real image is uploaded. It starts with "/" like a real asset but has no
// site-storage key, so it must not offer "Adjust image".
const PLACEHOLDER_IMAGE_SRC = `/${PLACEHOLDER_IMAGE_FILENAME}`

// An image src is adjustable only if it's a managed site-storage asset: a
// relative "/..." path (uploads are stored this way — see performUpload), which
// excludes external/absolute URLs. The placeholder is the one relative path that
// is NOT a real asset, so exclude it explicitly. Baking needs the stored key,
// which only real managed assets have.
export const isManagedSiteAsset = (src: string | undefined): boolean =>
  !!src && src.startsWith("/") && src !== PLACEHOLDER_IMAGE_SRC

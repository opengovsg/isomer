export const IMAGE_FIT = {
  Cover: "cover",
  Content: "contain",
} as const

// A focal point only applies under "cover": under "contain" the whole image is
// letterboxed, so there is nothing for an object-position to anchor.
export const isFocalApplicable = (imageFit?: string): boolean =>
  imageFit !== IMAGE_FIT.Content

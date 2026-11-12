export const IMAGE_FIT = {
  Cover: "cover",
  Content: "contain",
} as const

// "contain" shows the whole image, so a focal point has nothing to move.
export const isFocalApplicable = (imageFit?: string): boolean =>
  imageFit !== IMAGE_FIT.Content

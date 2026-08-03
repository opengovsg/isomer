export const isImageRadioFormat = (format: unknown): boolean =>
  typeof format === "string" &&
  (format === "image-radio" ||
    format === "image-radio/1col" ||
    format === "image-radio/2col")

export const getImageRadioColumnCount = (format: string): 1 | 2 =>
  format === "image-radio/1col" ? 1 : 2

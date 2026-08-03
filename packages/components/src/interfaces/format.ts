export const ARRAY_RADIO_FORMAT = "radio"
export const COLLECTION_DROPDOWN_FORMAT = "collection-dropdown"
export const DGS_DATASET_ID_FORMAT = "dgs-dataset-id"
export const IMAGE_RADIO_FORMAT = "image-radio"
export const IMAGE_RADIO_1COL_FORMAT = "image-radio/1col"
export const IMAGE_RADIO_2COL_FORMAT = "image-radio/2col"

export const IMAGE_RADIO_FORMATS = [
  IMAGE_RADIO_FORMAT,
  IMAGE_RADIO_1COL_FORMAT,
  IMAGE_RADIO_2COL_FORMAT,
] as const

export type ImageRadioFormat = (typeof IMAGE_RADIO_FORMATS)[number]

export const isImageRadioFormat = (
  format: unknown,
): format is ImageRadioFormat =>
  typeof format === "string" &&
  (format === IMAGE_RADIO_FORMAT ||
    format === IMAGE_RADIO_1COL_FORMAT ||
    format === IMAGE_RADIO_2COL_FORMAT)

export const getImageRadioColumnCount = (format: string): 1 | 2 =>
  format === IMAGE_RADIO_1COL_FORMAT ? 1 : 2

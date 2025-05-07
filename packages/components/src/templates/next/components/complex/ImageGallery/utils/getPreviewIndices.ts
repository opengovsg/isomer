import { MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW } from "../constants"

interface GetPreviewIndicesProps {
  numberOfImages: number
  currentIndex: number
}

export const getPreviewIndices = ({
  numberOfImages,
  currentIndex,
}: GetPreviewIndicesProps) => {
  // If there are less than or equal to 5 images, show all of them
  if (numberOfImages <= MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW) {
    return Array.from({ length: numberOfImages }, (_, i) => i)
  }

  const numberOfImagesBeforeCurrent = 2

  // Calculate the center position for the current image in preview
  const idealStart = Math.max(0, currentIndex - numberOfImagesBeforeCurrent)

  // Ensure we don't go past the end when displaying the maximum number of previews
  const maxStartPosition = numberOfImages - MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW

  // Get the final starting position
  const start = Math.min(idealStart, maxStartPosition)

  // Create and return the array of indices
  return Array.from(
    { length: MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW },
    (_, i) => start + i,
  )
}

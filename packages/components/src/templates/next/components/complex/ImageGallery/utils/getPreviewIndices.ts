interface GetPreviewIndicesProps {
  numberOfImages: number
  currentIndex: number
  maxPreviewImages: 3 | 5
}

export const getPreviewIndices = ({
  numberOfImages,
  currentIndex,
  maxPreviewImages,
}: GetPreviewIndicesProps) => {
  // If there are less than or equal to max images, show all of them
  if (numberOfImages <= maxPreviewImages) {
    return Array.from({ length: numberOfImages }, (_, i) => i)
  }

  const numberOfImagesBeforeCurrent = Math.floor(maxPreviewImages / 2)

  // Calculate the center position for the current image in preview
  const idealStart = Math.max(0, currentIndex - numberOfImagesBeforeCurrent)

  // Ensure we don't go past the end when displaying the maximum number of previews
  const maxStartPosition = numberOfImages - maxPreviewImages

  // Get the final starting position
  const start = Math.min(idealStart, maxStartPosition)

  // Create and return the array of indices
  return Array.from({ length: maxPreviewImages }, (_, i) => start + i)
}

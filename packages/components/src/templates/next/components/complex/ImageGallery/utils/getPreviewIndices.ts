interface GetPreviewIndicesProps {
  numberOfImages: number
  currentIndex: number
  maxPreviewImages: 3 | 5
}

/**
 * Calculates the indices of images to show in the preview window.
 * For 3 preview images: shows current image and 1 image on each side when possible
 * For 5 preview images: shows current image and 2 images on each side when possible
 */
export const getPreviewIndices = ({
  numberOfImages,
  currentIndex,
  maxPreviewImages,
}: GetPreviewIndicesProps) => {
  // If there are fewer images than the max preview count, show all of them
  if (numberOfImages <= maxPreviewImages) {
    return Array.from({ length: numberOfImages }, (_, i) => i)
  }

  switch (maxPreviewImages) {
    case 3: {
      // For 3 previews, we want 1 image before and 1 after the current image
      const imagesBeforeCurrent = 1
      const idealStartIndex = currentIndex - imagesBeforeCurrent
      const maxPossibleStartIndex = numberOfImages - 3
      const start = Math.max(
        0,
        Math.min(idealStartIndex, maxPossibleStartIndex),
      )
      return [start, start + 1, start + 2]
    }
    case 5: {
      // For 5 previews, we want 2 images before and 2 after the current image
      const imagesBeforeCurrent = 2
      const idealStartIndex = currentIndex - imagesBeforeCurrent
      const maxPossibleStartIndex = numberOfImages - 5
      const start = Math.max(
        0,
        Math.min(idealStartIndex, maxPossibleStartIndex),
      )
      return [start, start + 1, start + 2, start + 3, start + 4]
    }
    default: {
      const exhaustiveCheck: never = maxPreviewImages
      return exhaustiveCheck
    }
  }
}

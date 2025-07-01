interface GetEndingPreviewIndicesProps {
  numberOfImages: number
  maxPreviewImages: 3 | 5
}

export const getEndingPreviewIndices = ({
  numberOfImages,
  maxPreviewImages,
}: GetEndingPreviewIndicesProps): number[] => {
  const start = Math.max(numberOfImages - maxPreviewImages, 0)
  return Array.from({ length: numberOfImages - start }, (_, i) => start + i)
}

import type { ProcessedCollectionCardProps } from "~/interfaces"

export const shouldShowDate = (
  items: ProcessedCollectionCardProps[],
): boolean => 
  items.some((item) => item.date)


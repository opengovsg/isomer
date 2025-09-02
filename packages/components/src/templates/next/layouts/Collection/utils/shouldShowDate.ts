import type { ProcessedCollectionCardProps } from "~/interfaces"

export const shouldShowDate = (
  items: ProcessedCollectionCardProps[],
): boolean => {
  return items.some((item) => item.date)
}

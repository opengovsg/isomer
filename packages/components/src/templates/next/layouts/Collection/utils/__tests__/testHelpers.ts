import type { ProcessedCollectionCardProps } from "~/interfaces"

export const testCollectionItem = (
  overrides: Partial<ProcessedCollectionCardProps> &
    Pick<ProcessedCollectionCardProps, "title"> & {
      description?: ProcessedCollectionCardProps["description"]
    },
): ProcessedCollectionCardProps => {
  const { title, description = "", ...rest } = overrides

  return {
    id: "test-id",
    itemTitle: title,
    referenceLinkHref: undefined,
    imageSrc: undefined,
    title,
    description,
    ...rest,
  }
}

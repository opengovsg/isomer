import type { EgazetteAlgoliaCategory } from "~/interfaces/internal/EgazetteAlgoliaSearchInputBox"
import { useCurrentRefinements, useRefinementList } from "react-instantsearch"

interface SubCategoryRefinementListProps {
  categories: EgazetteAlgoliaCategory[]
}

export const SubCategoryRefinementList = ({
  categories,
}: SubCategoryRefinementListProps) => {
  const { items: refinementItems, refine } = useRefinementList({
    attribute: "subCategory",
    limit: 200,
  })
  const { items: currentRefinements } = useCurrentRefinements()

  const selectedCategoryValues = new Set(
    currentRefinements
      .find((entry) => entry.attribute === "category")
      ?.refinements.map((refinement) => String(refinement.value)) ?? [],
  )

  // Match the Jekyll behavior: hide the sub-category section entirely until a category is picked.
  if (selectedCategoryValues.size === 0) return null

  const availableSubCategories = categories.flatMap((category) =>
    selectedCategoryValues.has(category.value)
      ? (category.subCategories ?? [])
      : [],
  )

  const refinementByValue = new Map(
    refinementItems.map((item) => [item.value, item]),
  )

  const rows = availableSubCategories.map(({ value, displayLabel }) => {
    const match = refinementByValue.get(value)
    return {
      value,
      label: displayLabel,
      count: match?.count ?? 0,
      isRefined: match?.isRefined ?? false,
    }
  })

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const isDisabled = row.count === 0 && !row.isRefined
        return (
          <li key={row.value}>
            <label
              className={`flex items-start gap-2 ${
                isDisabled
                  ? "cursor-default text-base-content-medium"
                  : "cursor-pointer text-base-content"
              }`}
            >
              <input
                type="checkbox"
                checked={row.isRefined}
                disabled={isDisabled}
                onChange={() => refine(row.value)}
                className="mt-1 h-4 w-4 accent-utility-highlight"
              />
              <span className="prose-body-base flex-1">
                {row.label}
                {row.count === 0 ? (
                  <span className="text-base-content-medium">
                    {" "}
                    (No results)
                  </span>
                ) : (
                  <span className="text-base-content-medium">
                    {" "}
                    ({row.count})
                  </span>
                )}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

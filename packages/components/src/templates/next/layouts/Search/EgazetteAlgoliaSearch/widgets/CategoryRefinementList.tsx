import type { EgazetteAlgoliaCategory } from "~/interfaces/internal/EgazetteAlgoliaSearchInputBox"
import { useRefinementList } from "react-instantsearch"

interface CategoryRefinementListProps {
  categories: EgazetteAlgoliaCategory[]
}

export const CategoryRefinementList = ({
  categories,
}: CategoryRefinementListProps) => {
  const { items, refine } = useRefinementList({
    attribute: "category",
    limit: 50,
  })

  // Match the Jekyll behavior: always render every configured category in declared order,
  // even when Algolia returns zero hits for it. Empty rows stay clickable.
  const itemsByValue = new Map(items.map((item) => [item.value, item]))
  const rows = categories.map(({ value, displayLabel }) => {
    const match = itemsByValue.get(value)
    return {
      value,
      label: displayLabel,
      count: match?.count ?? 0,
      isRefined: match?.isRefined ?? false,
    }
  })

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.value}>
          <label className="flex cursor-pointer items-start gap-2 text-base-content">
            <input
              type="checkbox"
              checked={row.isRefined}
              onChange={() => refine(row.value)}
              className="mt-1 h-4 w-4 accent-utility-highlight"
            />
            <span className="prose-body-base flex-1">
              {row.label}
              <span className="text-base-content-medium"> ({row.count})</span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  )
}

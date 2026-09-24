import { useRefinementList } from "react-instantsearch"

import {
  Checkbox,
  CheckboxGroup,
} from "../../../../components/internal/Checkbox"
import { EGAZETTE_CATEGORIES } from "../categories"

export const CategoryRefinementList = () => {
  const { items, refine } = useRefinementList({
    attribute: "category",
    limit: 50,
  })

  // Match the Jekyll behavior: always render every category in declared order,
  // even when Algolia returns zero hits for it. Empty rows stay clickable.
  const itemsByValue = new Map(items.map((item) => [item.value, item]))
  const rows = EGAZETTE_CATEGORIES.map(({ value, displayLabel }) => {
    const match = itemsByValue.get(value)
    return {
      value,
      label: displayLabel,
      isRefined: match?.isRefined ?? false,
    }
  })

  const selectedValues = rows
    .filter((row) => row.isRefined)
    .map((row) => row.value)

  return (
    <CheckboxGroup className="gap-2" value={selectedValues}>
      {rows.map((row) => (
        <Checkbox
          key={row.value}
          className="w-fit cursor-pointer"
          value={row.value}
          onChange={() => refine(row.value)}
        >
          {row.label}
        </Checkbox>
      ))}
    </CheckboxGroup>
  )
}

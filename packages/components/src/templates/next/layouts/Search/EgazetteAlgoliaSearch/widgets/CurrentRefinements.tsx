import { useMemo } from "react"
import { BiX } from "react-icons/bi"
import { useCurrentRefinements } from "react-instantsearch"
import { Button } from "~/templates/next/components/internal/Button"

import { EGAZETTE_CATEGORIES } from "../categories"

export const CurrentRefinements = () => {
  // Year/month are surfaced through the range inputs; don't duplicate them as
  // removable chips here. "query" stays excluded to match the default behavior.
  const { items, refine } = useCurrentRefinements({
    excludedAttributes: ["query", "publishYear", "publishMonth"],
  })

  // Built once from a static constant rather than on every render.
  const labelLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    EGAZETTE_CATEGORIES.forEach((category) => {
      lookup.set(category.value, category.displayLabel)
      category.subCategories?.forEach((sub) => {
        lookup.set(sub.value, sub.displayLabel)
      })
    })
    return lookup
  }, [])

  if (items.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {items.flatMap((group) =>
        group.refinements.map((refinement) => {
          const display =
            labelLookup.get(String(refinement.value)) ?? refinement.label
          return (
            <li
              key={`${group.attribute}-${refinement.value}`}
              className="prose-body-sm inline-flex items-center gap-1 rounded-full border border-base-content-strong bg-white px-3 py-1 text-base-content transition-colors hover:bg-base-canvas-backdrop/50"
            >
              {display}
              <Button
                variant="unstyled"
                onPress={() => refine(refinement)}
                className="inline-flex h-auto min-h-0 items-center gap-0 rounded-full p-0 transition-colors active:bg-base-canvas-backdrop/80"
              >
                <BiX aria-hidden className="h-4 w-4" />
                <span className="sr-only">Remove filter</span>
              </Button>
            </li>
          )
        }),
      )}
    </ul>
  )
}

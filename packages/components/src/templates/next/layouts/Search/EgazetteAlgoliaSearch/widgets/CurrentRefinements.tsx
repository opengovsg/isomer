import type { EgazetteAlgoliaCategory } from "~/interfaces/internal/EgazetteAlgoliaSearchInputBox"
import { BiX } from "react-icons/bi"
import { useCurrentRefinements } from "react-instantsearch"

interface CurrentRefinementsProps {
  categories: EgazetteAlgoliaCategory[]
}

export const CurrentRefinements = ({ categories }: CurrentRefinementsProps) => {
  const { items, refine } = useCurrentRefinements()

  if (items.length === 0) return null

  const labelLookup = new Map<string, string>()
  categories.forEach((category) => {
    labelLookup.set(category.value, category.displayLabel)
    category.subCategories?.forEach((sub) => {
      labelLookup.set(sub.value, sub.displayLabel)
    })
  })

  return (
    <ul className="flex flex-wrap gap-2">
      {items.flatMap((group) =>
        group.refinements.map((refinement) => {
          const display =
            labelLookup.get(String(refinement.value)) ?? refinement.label
          return (
            <li key={`${group.attribute}-${refinement.value}`}>
              <button
                type="button"
                onClick={() => refine(refinement)}
                className="prose-body-sm inline-flex items-center gap-1 rounded-full border border-base-content-strong bg-white px-3 py-1 text-base-content"
              >
                {display}
                <BiX aria-hidden className="h-4 w-4" />
                <span className="sr-only">Remove filter</span>
              </button>
            </li>
          )
        }),
      )}
    </ul>
  )
}

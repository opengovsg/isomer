import { useClearRefinements } from "react-instantsearch"

export const ClearRefinements = () => {
  const { refine, canRefine } = useClearRefinements()

  if (!canRefine) return null

  return (
    <button
      type="button"
      onClick={() => refine()}
      className="prose-headline-base-medium text-link underline underline-offset-2 hover:text-link-hover"
    >
      Clear all filters
    </button>
  )
}

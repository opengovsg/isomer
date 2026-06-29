import { useClearRefinements } from "react-instantsearch"
import { Button } from "~/templates/next/components/internal/Button"

export const ClearRefinements = () => {
  const { refine, canRefine } = useClearRefinements()

  if (!canRefine) return null

  return (
    <Button
      variant="unstyled"
      onClick={() => refine()}
      className="prose-headline-base-medium text-link hover:text-link-hover self-start p-0 underline underline-offset-2"
    >
      Clear refinements
    </Button>
  )
}

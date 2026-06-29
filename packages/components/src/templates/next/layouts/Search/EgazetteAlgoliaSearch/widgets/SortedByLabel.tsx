import { useSearchBox } from "react-instantsearch"

export const SortedByLabel = () => {
  const { query } = useSearchBox()
  const isQuerying = query.trim() !== ""

  return (
    <p className="prose-body-sm text-base-content">
      {isQuerying ? "Sorted by relevancy" : "Sorted by most recent"}
    </p>
  )
}

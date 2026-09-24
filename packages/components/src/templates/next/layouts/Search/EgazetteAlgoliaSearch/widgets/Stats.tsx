import { useStats } from "react-instantsearch"

const MAX_REPORTED = 1000

export const Stats = () => {
  const { nbHits, query } = useStats()

  let content: string
  if (nbHits === 0) {
    content = query ? `No results found for ${query}` : "No results found"
  } else if (nbHits === 1) {
    content = "1 result found"
  } else if (nbHits > MAX_REPORTED) {
    content = "More than 1000 results found"
  } else {
    content = `${nbHits} results found`
  }

  return <p className="prose-body-base text-base-content">{content}</p>
}

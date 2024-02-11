import React, { useEffect, useRef, useState } from "react"
import Lunr from "lunr"

export type SearchRecord = {
  id: string
  title: string
  content: string
  url: string
}

export interface SearchProps {
  index: SearchRecord[]
}

const Search: React.FC<SearchProps> = ({ index }) => {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [results, setResults] = useState<SearchRecord[]>([])
  const indexRef = useRef<Lunr.Index | null>(null)

  // Initialize the Lunr index
  useEffect(() => {
    indexRef.current = Lunr(function () {
      this.ref("id")
      this.field("title")
      this.field("content")
      index.forEach((doc) => {
        // Convert the document into a format Lunr expects
        this.add({
          ...doc,
          id: String(doc.id), // Ensure the id is a string
        })
      })
    })
  }, [index]) // Rebuild the index whenever the index prop changes

  const highlightMatch = (content: string, searchTerm: string) => {
    const escapeRegExp = (str: any) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const searchTermRegex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi")

    // Adjust the context size as needed
    const contextSize = 150
    let match

    // Find the first match of the search term in the content
    const firstMatchIndex = content.search(searchTermRegex)

    // Calculate start and end indices for the snippet to ensure it includes the search term
    let start = Math.max(firstMatchIndex - contextSize, 0)
    let end = Math.min(
      firstMatchIndex + searchTerm.length + contextSize,
      content.length,
    )

    // Ensure we start and end at whole words
    if (start > 0) start = content.lastIndexOf(" ", start) + 1
    if (end < content.length) end = content.indexOf(" ", end) + 1

    // Extract the snippet
    let snippet = content.substring(start, end)

    // Highlight all occurrences of the search term in the snippet
    snippet = snippet.replace(searchTermRegex, "<strong>$1</strong>")

    // Add ellipses to indicate the snippet is part of larger content, if necessary
    if (start > 0) snippet = "... " + snippet
    if (end < content.length) snippet += " ..."

    return snippet
  }

  // Function to perform search
  // This uses wildcard search for prefix matching (no fuzzy search)
  const performSearch = (term: string) => {
    if (!term || !indexRef.current) {
      setResults([])
      return
    }

    // Append a wildcard to the search term for partial matches
    const wildcardTerm = `${term}*`
    console.log(`Searching for`, wildcardTerm)
    const searchResults = indexRef.current
      .search(wildcardTerm)
      .map(({ ref }) => {
        return index.find((doc) => String(doc.id) === ref)
      })
      .filter((result): result is SearchRecord => !!result)

    console.log(searchResults)

    setResults(searchResults)
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <label
        htmlFor="search"
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        Quick search
      </label>
      <div className="relative mt-2 flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            performSearch(e.target.value)
          }}
          placeholder="Enter search term..."
          className="block w-full rounded-md border-0 py-1.5 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
      <ul role="list" className="divide-y divide-gray-200">
        {results.length > 0 && (
          <ul>
            {results.map((result) => (
              <li key={String(result.id)} className="px-4 py-4 sm:px-6">
                <a
                  className="text-secondary text-xl underline"
                  href={result.url}
                >
                  {result.title}
                </a>
                <p className="text-md text-subtleLink">{result.url}</p>
                {/* Render the highlighted snippet */}
                <p
                  className="line-clamp-3 truncate"
                  dangerouslySetInnerHTML={{
                    __html: highlightMatch(result.content, searchTerm),
                  }}
                ></p>
              </li>
            ))}
          </ul>
        )}
      </ul>
    </div>
  )
}

export default Search

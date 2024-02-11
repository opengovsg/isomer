import React, { useEffect, useRef, useState } from "react"
import MiniSearch from "minisearch"

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

  console.log(results)

  // Use useRef to persist the MiniSearch instance
  const miniSearchRef = useRef(
    new MiniSearch({
      fields: ["title", "content"], // fields to index for searching
      storeFields: ["title", "content", "url"], // fields to return with search results
      searchOptions: {
        prefix: true,
      },
    }),
  )

  // Initialize the MiniSearch index
  useEffect(() => {
    miniSearchRef.current.removeAll()
    miniSearchRef.current.addAll(index)
  }, [index]) // Rebuild the index whenever the index prop changes

  const performSearch = (term: string) => {
    if (!term) {
      setResults([])
      return
    }

    // Perform the search using the ref
    const searchResults = miniSearchRef.current.search(term)
    console.log(searchResults)

    // Assuming miniSearch is configured to store 'title', 'content', and 'url'
    const mappedResults = searchResults
      .map((result) => {
        // Directly access the matching document in the `index` prop by ID
        const fullDocument = index.find((doc) => doc.id === result.id)
        return fullDocument || result
      })
      .filter((result): result is SearchRecord => !!result)

    setResults(mappedResults)
  }

  const highlightMatch = (content: string, searchTerm: string) => {
    const escapeRegExp = (str: string) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const searchTermRegex = new RegExp(`(${escapeRegExp(searchTerm)})`, "gi")

    return content.replace(searchTermRegex, "<strong>$1</strong>")
  }

  return (
    <div className="container max-w-5xl overflow-hidden bg-white shadow sm:rounded-md">
      <div className="relative mt-2 flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            performSearch(e.target.value)
          }}
          placeholder="Enter search term..."
          className="block w-full rounded-md border-0 py-3 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6"
        />
      </div>
      {results.length > 0 && (
        <ul>
          {results.map((result) => (
            <li key={String(result.id)} className="px-4 py-4 sm:px-6">
              <a className="text-secondary text-xl underline" href={result.url}>
                {result.title}
              </a>
              <p className="text-md text-subtleLink">{result.url}</p>
              {/* Render the highlighted snippet */}
              <p
                className="line-clamp-3 truncate"
                dangerouslySetInnerHTML={{
                  __html: highlightMatch(result.content, searchTerm),
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Search

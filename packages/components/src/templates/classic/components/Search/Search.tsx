"use client"

import React, { useEffect, useRef, useState } from "react"
import MiniSearch from "minisearch"
import { BiChevronsLeft, BiChevronsRight } from "react-icons/bi"
import type { SearchProps } from "~/interfaces"
import type { SearchRecord } from "~/interfaces/internal/Search"
import DOMPurify from "isomorphic-dompurify"

const Search: React.FC<SearchProps> = ({ index }) => {
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [results, setResults] = useState<SearchRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [resultsPerPage, setResultsPerPage] = useState(10)

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

  const indexOfLastResult = currentPage * resultsPerPage
  const indexOfFirstResult = indexOfLastResult - resultsPerPage
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult)

  // Pagination controls
  const pageNumbers: number[] = []
  for (let i = 1; i <= Math.ceil(results.length / resultsPerPage); i++) {
    pageNumbers.push(i)
  }

  const renderPageNumbers = () => {
    const totalItems = results.length
    const totalPages = Math.ceil(totalItems / resultsPerPage)
    const pagesToShow = 5 // Max pages to show at once
    let startPage = 1
    let endPage = 1

    if (totalPages <= pagesToShow) {
      // Total pages less than pages to show, display all pages
      startPage = 1
      endPage = totalPages
    } else {
      // Calculate start and end pages
      const maxPagesBeforeCurrentPage = Math.floor(pagesToShow / 2)
      const maxPagesAfterCurrentPage = Math.ceil(pagesToShow / 2) - 1
      if (currentPage <= maxPagesBeforeCurrentPage) {
        // Near the beginning; show first pages
        startPage = 1
        endPage = pagesToShow
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        // Near the end; show last pages
        startPage = totalPages - pagesToShow + 1
        endPage = totalPages
      } else {
        // Somewhere in the middle; show some pages before and after current page
        startPage = currentPage - maxPagesBeforeCurrentPage
        endPage = currentPage + maxPagesAfterCurrentPage
      }
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, idx) => startPage + idx,
    ).map((page) => (
      <button
        key={page}
        onClick={() => setCurrentPage(page)}
        className={`inline-flex cursor-pointer items-center border-t-2 px-4 pt-4 text-sm font-medium ${
          currentPage === page
            ? "border-indigo-500 text-indigo-600"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
        }`}
      >
        {page}
      </button>
    ))
  }

  return (
    <div className="container my-10 max-w-5xl overflow-hidden bg-white shadow sm:rounded-md">
      <div className="relative mt-2 flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            performSearch(e.target.value)
            setCurrentPage(1)
          }}
          placeholder="Enter search term..."
          className="block w-full rounded-md border-0 p-3 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-lg sm:leading-6"
        />
      </div>
      {currentResults.length > 0 && (
        <ul>
          {currentResults.map((result) => (
            <li key={String(result.id)} className="px-4 py-4 sm:px-6">
              <a
                className="text-xl text-site-secondary underline"
                href={result.url}
              >
                {result.title}
              </a>
              <p className="text-md text-subtleLink">{result.url}</p>
              {/* Render the highlighted snippet */}
              <p
                className="line-clamp-3 truncate"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    highlightMatch(result.content, searchTerm),
                  ),
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <nav className="flex items-center justify-between border-t border-gray-200 px-4 py-5 sm:px-0">
        <div className="-mt-px flex w-0 flex-1">
          <button
            onClick={() => setCurrentPage(1)}
            className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            <BiChevronsLeft
              className="mr-3 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            First
          </button>
        </div>
        <div className="hidden md:-mt-px md:flex">{renderPageNumbers()}</div>
        <div className="-mt-px flex w-0 flex-1 justify-end">
          <button
            onClick={() => setCurrentPage(pageNumbers.length)}
            className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            Last
            <BiChevronsRight
              className="ml-3 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Search

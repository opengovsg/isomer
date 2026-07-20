import type { UseSearchBoxProps } from "react-instantsearch"
import { useEffect, useRef, useState } from "react"
import { BiSearch } from "react-icons/bi"
import { useSearchBox } from "react-instantsearch"

const DEBOUNCE_MS = 250

// Disable the connector's default debounce — we manage it locally so the input stays in sync.
// Must be a stable reference: useSearchBox re-registers the widget when its props change
// identity, which loops into "Too many re-renders" on any refinement change.
const queryHook: NonNullable<UseSearchBoxProps["queryHook"]> = (
  newQuery,
  search,
) => search(newQuery)

export const SearchBox = () => {
  const { query, refine } = useSearchBox({ queryHook })
  const [value, setValue] = useState(query)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setValue(query)
  }, [query])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <label className="relative flex w-full items-center">
      <BiSearch
        aria-hidden
        className="pointer-events-none absolute left-3 h-5 w-5 text-base-content-medium"
      />
      <span className="sr-only">Search</span>
      <input
        type="search"
        autoFocus
        placeholder="Start typing to search"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          setValue(next)
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => refine(next), DEBOUNCE_MS)
        }}
        className="prose-body-base h-12 w-full rounded border border-base-content-strong bg-white pl-10 pr-3 text-base-content placeholder:text-base-content-medium focus:outline-none focus:ring-2 focus:ring-utility-highlight [&::-webkit-search-cancel-button]:cursor-pointer"
      />
    </label>
  )
}

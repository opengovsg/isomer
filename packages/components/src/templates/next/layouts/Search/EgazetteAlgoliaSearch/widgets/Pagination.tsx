import { usePagination } from "react-instantsearch"

import { PaginationControls } from "../../../../components/internal/PaginationControls"

export const Pagination = () => {
  const { currentRefinement, nbPages, refine } = usePagination()

  if (nbPages <= 1) return null

  // PaginationControls derives its page count as ceil(totalItems / itemsPerPage)
  // and is 1-indexed; react-instantsearch pages are 0-indexed. Treating each
  // Algolia page as a single "item" makes the rendered page count exactly nbPages.
  return (
    <div className="flex w-full justify-center lg:justify-end">
      <PaginationControls
        totalItems={nbPages}
        itemsPerPage={1}
        currPage={currentRefinement + 1}
        setCurrPage={(page) => {
          refine(page - 1)
          // Pagination sits below the results, so paging otherwise leaves the
          // viewport at the bottom of the previous page's list. Jump back to the
          // top so the new page starts in view, matching the legacy eGazette.
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0 })
          }
        }}
      />
    </div>
  )
}

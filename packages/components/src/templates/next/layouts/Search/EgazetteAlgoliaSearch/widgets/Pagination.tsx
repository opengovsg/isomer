import { usePagination } from "react-instantsearch"

const PADDING = 2

const buildPageNumbers = (currentPage: number, totalPages: number) => {
  const start = Math.max(0, currentPage - PADDING)
  const end = Math.min(totalPages - 1, currentPage + PADDING)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

const buttonClass = (active: boolean) =>
  `prose-headline-base-medium inline-flex h-9 min-w-9 items-center justify-center rounded border px-2 ${
    active
      ? "border-base-content-strong bg-base-content-strong text-base-canvas-default"
      : "border-base-content-strong bg-white text-base-content hover:bg-utility-feedback-info-subtle disabled:opacity-50"
  }`

export const Pagination = () => {
  const { currentRefinement, nbPages, refine, isFirstPage, isLastPage } =
    usePagination()

  if (nbPages <= 1) return null

  const pages = buildPageNumbers(currentRefinement, nbPages)
  const lastPage = nbPages - 1

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => refine(0)}
        disabled={isFirstPage}
        className={buttonClass(false)}
      >
        « First
      </button>
      <button
        type="button"
        onClick={() => refine(Math.max(0, currentRefinement - 1))}
        disabled={isFirstPage}
        className={buttonClass(false)}
      >
        ‹ Prev
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => refine(page)}
          aria-current={page === currentRefinement ? "page" : undefined}
          className={buttonClass(page === currentRefinement)}
        >
          {page + 1}
        </button>
      ))}
      <button
        type="button"
        onClick={() => refine(Math.min(lastPage, currentRefinement + 1))}
        disabled={isLastPage}
        className={buttonClass(false)}
      >
        Next ›
      </button>
      <button
        type="button"
        onClick={() => refine(lastPage)}
        disabled={isLastPage}
        className={buttonClass(false)}
      >
        Last »
      </button>
    </nav>
  )
}

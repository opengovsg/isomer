import { BiChevronRight, BiChevronLeft } from "react-icons/bi"

import type { PaginationProps } from "../../../types/Pagination"

export const Pagination = ({
  totalItems,
  itemsPerPage,
  currPage,
  setCurrPage,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / Math.max(1, itemsPerPage))

  return (
    <nav className="flex w-full flex-row gap-3" aria-label="Pagination">
      {/* Previous button */}
      <button
        className="flex cursor-pointer flex-row gap-1 justify-self-end p-1 align-middle hover:bg-interaction-main-subtle-hover disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
        aria-label="Previous page"
        disabled={currPage <= 1}
        onClick={() => {
          if (currPage > 1) {
            setCurrPage(currPage - 1)
          }
        }}
      >
        <BiChevronLeft className="my-auto text-2xl" />
      </button>

      {/* Page number */}
      <p className="col-span-2 my-auto justify-self-center text-base text-gray-700 leading-6">
        Page {currPage} of {totalPages}
      </p>

      {/* Next button */}
      <button
        className="flex cursor-pointer flex-row gap-1 justify-self-start p-1 align-middle hover:bg-interaction-main-subtle-hover disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent sm:justify-self-end"
        aria-label="Next page"
        disabled={currPage >= totalPages}
        onClick={() => {
          if (currPage < totalPages) {
            setCurrPage(currPage + 1)
          }
        }}
      >
        <BiChevronRight className="my-auto text-2xl" />
      </button>
    </nav>
  )
}

export default Pagination

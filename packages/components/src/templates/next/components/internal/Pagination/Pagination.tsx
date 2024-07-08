import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi"

import type { PaginationProps } from "../../../types/Pagination"

export const Pagination = ({
  totalItems,
  itemsPerPage,
  currPage,
  setCurrPage,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / Math.max(1, itemsPerPage))

  return (
    <nav className="grid w-full grid-cols-4" aria-label="Pagination">
      {/* Previous button */}
      <button
        className="flex cursor-pointer flex-row gap-1 justify-self-end p-1 align-middle hover:bg-interaction-main-subtle-hover disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent"
        aria-label="Previous page"
        disabled={currPage <= 1}
        onClick={() => {
          if (currPage > 1) {
            setCurrPage(currPage - 1)
          }
        }}
      >
        <BiLeftArrowAlt className="my-auto text-2xl" />
        <p className="hidden text-lg underline xs:inline">Previous</p>
      </button>

      {/* Page number */}
      <p className="col-span-2 my-auto justify-self-center xs:text-lg xs:leading-8">
        Page {currPage} of {totalPages}
      </p>

      {/* Next button */}
      <button
        className="flex cursor-pointer flex-row gap-1 justify-self-start p-1 align-middle hover:bg-interaction-main-subtle-hover disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent sm:justify-self-end"
        aria-label="Next page"
        disabled={currPage >= totalPages}
        onClick={() => {
          if (currPage < totalPages) {
            setCurrPage(currPage + 1)
          }
        }}
      >
        <p className="hidden text-lg underline xs:inline">Next</p>
        <BiRightArrowAlt className="my-auto text-2xl" />
      </button>
    </nav>
  )
}

export default Pagination

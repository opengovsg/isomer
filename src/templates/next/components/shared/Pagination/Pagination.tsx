import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi"
import type { PaginationProps } from "../../../types/Pagination"

export const Pagination = ({
  totalItems,
  itemsPerPage,
  currPage,
  setCurrPage,
}: Omit<PaginationProps, "type">) => {
  const totalPages = Math.ceil(totalItems / Math.max(1, itemsPerPage))

  return (
    <nav className="flex flex-row w-full" aria-label="Pagination">
      {/* Previous button */}
      <button
        className="flex flex-row p-1 gap-1 align-middle cursor-pointer disabled:cursor-not-allowed disabled:text-interaction-sub disabled:hover:bg-transparent hover:bg-interaction-main-subtle-hover"
        aria-label="Previous page"
        disabled={currPage <= 1}
        onClick={() => {
          if (currPage > 1) {
            setCurrPage(currPage - 1)
          }
        }}
      >
        <BiLeftArrowAlt className="text-2xl my-auto" />
        <p className="hidden xs:inline underline text-lg">Previous</p>
      </button>

      {/* Spacing */}
      <div className="flex-grow" />

      {/* Page number */}
      <p className="my-auto xs:text-xl xs:leading-8">
        Page {currPage} of {totalPages}
      </p>

      {/* Spacing */}
      <div className="flex-grow" />

      {/* Next button */}
      <button
        className="flex flex-row p-1 gap-1 align-middle cursor-pointer disabled:cursor-not-allowed disabled:text-interaction-sub disabled:hover:bg-transparent hover:bg-interaction-main-subtle-hover"
        aria-label="Next page"
        disabled={currPage >= totalPages}
        onClick={() => {
          if (currPage < totalPages) {
            setCurrPage(currPage + 1)
          }
        }}
      >
        <p className="hidden xs:inline underline text-lg">Next</p>
        <BiRightArrowAlt className="text-2xl my-auto" />
      </button>
    </nav>
  )
}

export default Pagination

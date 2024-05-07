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
    <nav className="grid grid-cols-4 w-full" aria-label="Pagination">
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

      {/* Page number */}
      <p className="col-span-2 justify-self-center my-auto xs:text-xl xs:leading-8">
        Page {currPage} of {totalPages}
      </p>

      {/* Next button */}
      <button
        className="justify-self-end flex flex-row p-1 gap-1 align-middle cursor-pointer disabled:cursor-not-allowed disabled:text-interaction-sub disabled:hover:bg-transparent hover:bg-interaction-main-subtle-hover"
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

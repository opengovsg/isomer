import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi";

import type { PaginationProps } from "../../../types/Pagination";

export const Pagination = ({
  totalItems,
  itemsPerPage,
  currPage,
  setCurrPage,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / Math.max(1, itemsPerPage));

  return (
    <nav className="grid w-full grid-cols-4" aria-label="Pagination">
      {/* Previous button */}
      <button
        className="hover:bg-interaction-main-subtle-hover flex cursor-pointer flex-row gap-1 justify-self-end p-1 align-middle disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent"
        aria-label="Previous page"
        disabled={currPage <= 1}
        onClick={() => {
          if (currPage > 1) {
            setCurrPage(currPage - 1);
          }
        }}
      >
        <BiLeftArrowAlt className="my-auto text-2xl" />
        <p className="xs:inline hidden text-lg underline">Previous</p>
      </button>

      {/* Page number */}
      <p className="xs:text-lg xs:leading-8 col-span-2 my-auto justify-self-center">
        Page {currPage} of {totalPages}
      </p>

      {/* Next button */}
      <button
        className="hover:bg-interaction-main-subtle-hover flex cursor-pointer flex-row gap-1 justify-self-start p-1 align-middle disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent sm:justify-self-end"
        aria-label="Next page"
        disabled={currPage >= totalPages}
        onClick={() => {
          if (currPage < totalPages) {
            setCurrPage(currPage + 1);
          }
        }}
      >
        <p className="xs:inline hidden text-lg underline">Next</p>
        <BiRightArrowAlt className="my-auto text-2xl" />
      </button>
    </nav>
  );
};

export default Pagination;

"use client"

import type { PaginationProps } from "../../../types/Pagination"
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./Pagination"
import { usePaginationRange } from "./usePaginationRange"

const SEPARATOR = "-"

export function PaginationControls({
  totalItems,
  itemsPerPage,
  currPage,
  setCurrPage,
}: PaginationProps) {
  const paginationRange = usePaginationRange<typeof SEPARATOR>({
    totalCount: totalItems,
    pageSize: itemsPerPage,
    currentPage: currPage,
    separator: SEPARATOR,
    siblingCount: 1,
  })

  const totalPageCount = Math.ceil(totalItems / itemsPerPage)

  return (
    <Pagination className="not-prose items-center gap-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            isDisabled={currPage === 1}
            onPress={() => setCurrPage((p) => Math.max(1, p - 1))}
          />
        </PaginationItem>
        {paginationRange.map((p, i) => {
          return p === SEPARATOR ? (
            <PaginationEllipsis key={i} />
          ) : (
            <PaginationItem key={i}>
              <PaginationButton
                isActive={currPage === p}
                onPress={() => setCurrPage(p)}
              >
                {p}
              </PaginationButton>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext
            isDisabled={currPage >= totalPageCount}
            onPress={() => setCurrPage((p) => Math.min(totalItems, p + 1))}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

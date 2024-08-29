"use client"

import { useMediaQuery } from "usehooks-ts"

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

interface PaginationControlsProps extends PaginationProps {
  onPageChange?: () => void
}

export function PaginationControls({
  totalItems,
  itemsPerPage,
  currPage,
  setCurrPage,
  onPageChange,
}: PaginationControlsProps) {
  const isTablet = useMediaQuery("(min-width: 768px)")

  const paginationRange = usePaginationRange<typeof SEPARATOR>({
    totalCount: totalItems,
    pageSize: itemsPerPage,
    currentPage: currPage,
    separator: SEPARATOR,
    siblingCount: isTablet ? 1 : 0,
  })

  const totalPageCount = Math.ceil(totalItems / itemsPerPage)

  return (
    <Pagination className="not-prose items-center gap-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            isDisabled={currPage === 1}
            onPress={() => {
              onPageChange?.()
              setCurrPage((p) => Math.max(1, p - 1))
            }}
          />
        </PaginationItem>
        {paginationRange.map((p, i) => {
          return p === SEPARATOR ? (
            <PaginationEllipsis key={i} />
          ) : (
            <PaginationItem key={i}>
              <PaginationButton
                isActive={currPage === p}
                onPress={() => {
                  onPageChange?.()
                  setCurrPage(p)
                }}
              >
                {p}
              </PaginationButton>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext
            isDisabled={currPage >= totalPageCount}
            onPress={() => {
              onPageChange?.()
              setCurrPage((p) => Math.min(totalPageCount, p + 1))
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

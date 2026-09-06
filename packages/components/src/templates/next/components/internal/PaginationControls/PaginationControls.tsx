"use client"

import { useBreakpoint } from "~/hooks/useBreakpoint"

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

export const PaginationControls = ({
  totalItems,
  itemsPerPage,
  currPage,
  setCurrPage,
  onPageChange,
}: PaginationControlsProps) => {
  const isTablet = useBreakpoint("md")

  const paginationRange = usePaginationRange<typeof SEPARATOR>({
    currentPage: currPage,
    pageSize: itemsPerPage,
    separator: SEPARATOR,
    siblingCount: isTablet ? 1 : 0,
    totalCount: totalItems,
  })

  const totalPageCount = Math.ceil(totalItems / itemsPerPage)
  const paginationKeys = paginationRange.map((p, i) =>
    p === SEPARATOR ? `ellipsis-${i}` : `page-${p}`,
  )

  return (
    <Pagination className="not-prose items-center gap-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            isDisabled={currPage === 1}
            onPress={() => {
              onPageChange?.()
              setCurrPage(Math.max(1, currPage - 1))
            }}
          />
        </PaginationItem>
        {paginationRange.map((p, i) =>
          p === SEPARATOR ? (
            <PaginationEllipsis key={paginationKeys[i]} />
          ) : (
            <PaginationItem key={paginationKeys[i]}>
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
          ),
        )}
        <PaginationItem>
          <PaginationNext
            isDisabled={currPage >= totalPageCount}
            onPress={() => {
              onPageChange?.()
              setCurrPage(Math.min(totalPageCount, currPage + 1))
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

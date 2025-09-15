"use client"

import { useId, useMemo, useRef, useState } from "react"

import type { DgsApiDatasetSearchParams } from "~/hooks/useDgsData/types"
import type {
  DGSSearchableTableProps,
  NativeSearchableTableProps,
} from "~/interfaces"
import { useDebounce } from "~/hooks/useDebounce"
import { useDgsData } from "~/hooks/useDgsData"
import { tv } from "~/lib/tv"
import BaseParagraph from "../../../internal/BaseParagraph"
import { PaginationControls } from "../../../internal/PaginationControls"
import { SearchField } from "../../../internal/Search"
import { CellContent } from "./CellContent"
import { PAGINATION_MAX_ITEMS } from "./constants"
import { EmptyState, FallbackEmptyState } from "./EmptyState"

const createSearchableTableStyles = tv({
  slots: {
    container: "mx-auto w-full",
    title: "prose-display-md mb-9 break-words text-base-content-strong",
    tableContainer: "mt-8 overflow-x-auto",
    table:
      "[&_>_tbody_>_tr:nth-child(even)_>_td]:bg-base-canvas-default w-full border-collapse border-spacing-0 [&_>_tbody_>_tr:nth-child(odd)_>_td]:bg-base-canvas-alt",
    tableRow: "text-left",
    tableCell:
      "max-w-40 break-words border border-base-divider-medium px-4 py-3 align-top last:max-w-full [&_li]:my-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ul]:mt-0 [&_ul]:ps-5",
    pagination: "mt-8 flex w-full justify-center lg:justify-end",
  },
  variants: {
    isHeader: {
      true: {
        tableCell:
          "bg-brand-interaction text-base-content-inverse [&_ol]:prose-label-md-medium [&_p]:prose-label-md-medium",
      },
      false: {
        tableCell: "text-base-content [&_ol]:prose-body-sm [&_p]:prose-body-sm",
      },
    },
  },
})

export const compoundStyles = createSearchableTableStyles()

interface DynamicSearchableTableClientProps
  extends Omit<DGSSearchableTableProps, "items" | "headers"> {
  headers: NativeSearchableTableProps["headers"]
  maxNoOfColumns: number
  isMetadataLoading: boolean
  isMetadataError: boolean
}

export const DynamicSearchableTableClient = ({
  dataSource: { resourceId, filters, sort },
  title,
  headers,
  site,
  LinkComponent,
  maxNoOfColumns, // not using MAX_NUMBER_OF_COLUMNS as we should not arbitrarily slice the columns
  isMetadataLoading,
  isMetadataError,
}: DynamicSearchableTableClientProps) => {
  const [_search, setSearch] = useState("")
  const search = useDebounce({ value: _search, delay: 300 })
  const [currPage, setCurrPage] = useState(1)
  const titleId = useId()

  const params = useMemo(
    () => ({
      resourceId,
      filters: filters?.reduce<
        NonNullable<DgsApiDatasetSearchParams["filters"]>
      >((acc, filter) => {
        acc[filter.fieldKey] = filter.fieldValue
        return acc
      }, {}),
      sort,
    }),
    [resourceId, filters, sort],
  )

  const {
    records,
    total,
    isLoading: isDataLoading,
    isError: isDataError,
  } = useDgsData({
    ...params,
    q: search,
    limit: PAGINATION_MAX_ITEMS,
    offset: (currPage - 1) * PAGINATION_MAX_ITEMS,
    fetchAll: false,
  })

  const filteredItems = records?.map((record) => Object.values(record)) ?? []

  const paginatedItems = filteredItems

  const isInitiallyEmpty =
    typeof total === "number" && (total === 0 || maxNoOfColumns === 0)

  const isFilteredEmpty =
    typeof total === "number" && total !== 0 && filteredItems.length === 0

  const sectionTopRef = useRef<HTMLDivElement>(null)
  const onPageChange = () => {
    sectionTopRef.current?.scrollIntoView({
      block: "start",
    })
  }

  const isLoading = isMetadataLoading || isDataLoading
  const isError = isMetadataError || isDataError

  return (
    <div className={compoundStyles.container()} ref={sectionTopRef}>
      {!!title && (
        <h2 id={titleId} className={compoundStyles.title()}>
          {title}
        </h2>
      )}

      <SearchField
        aria-label="Search table"
        placeholder="Enter a search term"
        value={_search}
        onChange={(value) => {
          setSearch(value)
          setCurrPage(1)
        }}
      />

      {(isInitiallyEmpty || isLoading || isError) && (
        <FallbackEmptyState isLoading={isLoading} isError={isError} />
      )}

      {isFilteredEmpty && (
        <EmptyState
          search={search}
          onClick={() => {
            setSearch("")
            setCurrPage(1)
          }}
        />
      )}

      {paginatedItems.length > 0 && (
        <div className={compoundStyles.tableContainer()} tabIndex={0}>
          <table
            className={compoundStyles.table()}
            aria-describedby={!!title ? titleId : undefined}
          >
            <tbody>
              <tr className={compoundStyles.tableRow()}>
                {headers.slice(0, maxNoOfColumns).map((header, index) => (
                  <th
                    key={index}
                    className={compoundStyles.tableCell({ isHeader: true })}
                  >
                    <BaseParagraph
                      content={String(header)}
                      site={site}
                      LinkComponent={LinkComponent}
                    />
                  </th>
                ))}
              </tr>

              {paginatedItems.map((row, rowIndex) => {
                return (
                  <tr key={rowIndex} className={compoundStyles.tableRow()}>
                    {row?.slice(0, maxNoOfColumns).map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={compoundStyles.tableCell({
                          isHeader: false,
                        })}
                      >
                        <CellContent
                          content={cell}
                          site={site}
                          LinkComponent={LinkComponent}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredItems.length > 0 && (
        <div className={compoundStyles.pagination()}>
          <PaginationControls
            totalItems={total ?? 0}
            onPageChange={onPageChange}
            itemsPerPage={PAGINATION_MAX_ITEMS}
            currPage={currPage}
            setCurrPage={setCurrPage}
          />
        </div>
      )}
    </div>
  )
}

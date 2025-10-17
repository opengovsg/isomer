"use client"

import { useDeferredValue, useId, useMemo, useRef, useState } from "react"

import type { SearchableTableClientProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import BaseParagraph from "../../../internal/BaseParagraph"
import { PaginationControls } from "../../../internal/PaginationControls"
import { SearchField } from "../../../internal/Search"
import { CellContent } from "./CellContent"
import { MAX_NUMBER_OF_COLUMNS, PAGINATION_MAX_ITEMS } from "./constants"
import { EmptyState, FallbackEmptyState } from "./EmptyState"
import { getFilteredItems } from "./getFilteredItems"
import { getPaginatedItems } from "./getPaginatedItems"

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

export const SearchableTableClient = ({
  title,
  headers,
  items,
  site,
  LinkComponent,
  isLoading = false,
  isError = false,
}: SearchableTableClientProps) => {
  const [_search, setSearch] = useState("")
  const search = useDeferredValue(_search)
  const [currPage, setCurrPage] = useState(1)
  const titleId = useId()

  const maxNoOfColumns = Math.min(headers.length, MAX_NUMBER_OF_COLUMNS)
  const filteredItems = useMemo(
    () =>
      getFilteredItems({
        items,
        searchValue: search,
      }),
    [items, search],
  )

  const paginatedItems = useMemo(
    () =>
      getPaginatedItems({
        items: filteredItems,
        currPage,
        itemsPerPage: PAGINATION_MAX_ITEMS,
      }),
    [currPage, filteredItems],
  )

  const isInitiallyEmpty = items.length === 0 || maxNoOfColumns === 0
  const isFilteredEmpty = items.length !== 0 && filteredItems.length === 0

  const sectionTopRef = useRef<HTMLDivElement>(null)
  const onPageChange = () => {
    sectionTopRef.current?.scrollIntoView({
      block: "start",
    })
  }

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
        value={search}
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
                    {row.slice(0, maxNoOfColumns).map((cell, cellIndex) => (
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
            totalItems={filteredItems.length}
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

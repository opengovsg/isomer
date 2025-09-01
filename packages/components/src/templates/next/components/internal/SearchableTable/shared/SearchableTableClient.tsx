"use client"

import { useDeferredValue, useId, useMemo, useRef, useState } from "react"

import type { SearchableTableClientProps } from "~/interfaces"
import BaseParagraph from "../../BaseParagraph"
import { PaginationControls } from "../../PaginationControls"
import { SearchField } from "../../Search"
import { CellContent } from "./CellContent"
import { compoundStyles } from "./common"
import { MAX_NUMBER_OF_COLUMNS, PAGINATION_MAX_ITEMS } from "./constants"
import { EmptyState } from "./EmptyState"
import { getFilteredItems } from "./getFilteredItems"
import { getPaginatedItems } from "./getPaginatedItems"

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

  const maxNoOfColumns = Math.min(
    headers.length,
    ...items.map((row) => row.row.length),
    MAX_NUMBER_OF_COLUMNS,
  )
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
        <EmptyState isLoading={isLoading} isError={isError} />
      )}

      {isFilteredEmpty && (
        <div className={compoundStyles.emptyState()}>
          <div className={compoundStyles.emptyStateHeadings()}>
            <p className={compoundStyles.emptyStateTitle({ bold: false })}>
              No search results for “
              <b className={compoundStyles.emptyStateTitle({ bold: true })}>
                {search}
              </b>
              ”
            </p>

            <p className={compoundStyles.emptyStateSubtitle()}>
              Check if you have a spelling error or try a different search term.
            </p>
          </div>

          <button
            className={compoundStyles.emptyStateButton()}
            onClick={() => {
              setSearch("")
              setCurrPage(1)
            }}
          >
            Clear search
          </button>
        </div>
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

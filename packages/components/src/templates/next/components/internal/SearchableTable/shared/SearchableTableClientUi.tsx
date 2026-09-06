"use client"

import type { SearchableTableClientProps } from "~/interfaces"
import { useId, useRef } from "react"
import { tv } from "~/lib/tv"
import { handleHorizontalScrollKeyDown } from "~/utils/handleHorizontalScrollKeyDown"
import { hasNonEmptyString } from "~/utils/truthiness"

import { BaseParagraph } from "../../../internal/BaseParagraph"
import { PaginationControls } from "../../../internal/PaginationControls"
import { SearchField } from "../../../internal/Search"
import { COPYWRITING_MAPPING, PAGINATION_MAX_ITEMS } from "./constants"
import { EmptyState, FallbackEmptyState } from "./EmptyState"

const createSearchableTableStyles = tv({
  slots: {
    container: "mx-auto w-full",
    pagination: "mt-8 flex w-full justify-center lg:justify-end",
    table:
      "[&_>_tbody_>_tr:nth-child(even)_>_td]:bg-base-canvas-default w-full border-collapse border-spacing-0 [&_>_tbody_>_tr:nth-child(odd)_>_td]:bg-base-canvas-alt",
    tableCell:
      "max-w-40 break-words border border-base-divider-medium px-4 py-3 align-top last:max-w-full [&_li]:my-0 [&_li]:pl-1 [&_ol]:mt-0 [&_ol]:ps-5 [&_ul]:mt-0 [&_ul]:ps-5",
    tableContainer: "mt-8 overflow-x-auto",
    tableRow: "text-left",
    title: "prose-display-sm mb-9 break-words text-base-content-strong",
  },
  variants: {
    isHeader: {
      false: {
        tableCell: "text-base-content [&_ol]:prose-body-sm [&_p]:prose-body-sm",
      },
      true: {
        tableCell:
          "bg-brand-interaction text-base-content-inverse [&_ol]:prose-label-md-medium [&_p]:prose-label-md-medium",
      },
    },
  },
})

const compoundStyles = createSearchableTableStyles()

interface SearchableTableClientUIProps extends Omit<
  SearchableTableClientProps,
  "items"
> {
  search: {
    input: string
    deferred: string
    setSearch: (search: string) => void
  }
  page: {
    currPage: number
    setCurrPage: (currPage: number) => void
  }
  isInitiallyEmpty: boolean
  isFilteredEmpty: boolean
  maxNoOfColumns: number
  paginatedItems: (string | number)[][]
  filteredItemsLength: number
  searchMatchType: keyof typeof COPYWRITING_MAPPING
}

interface SearchableTableContentProps {
  titleId: string
  title: string | undefined
  isInitiallyEmpty: boolean
  isLoading: boolean
  isError: boolean
  isFilteredEmpty: boolean
  deferredSearch: string
  setSearch: (search: string) => void
  setCurrPage: (currPage: number) => void
  searchMatchType: keyof typeof COPYWRITING_MAPPING
  paginatedItems: (string | number)[][]
  maxNoOfColumns: number
  headers: SearchableTableClientProps["headers"]
}

// oxlint-disable-next-line react-doctor/no-many-boolean-props -- table state flags drive mutually exclusive views
const SearchableTableContent = ({
  titleId,
  title,
  isInitiallyEmpty,
  isLoading,
  isError,
  isFilteredEmpty,
  deferredSearch,
  setSearch,
  setCurrPage,
  searchMatchType,
  paginatedItems,
  maxNoOfColumns,
  headers,
}: SearchableTableContentProps) => {
  if (isInitiallyEmpty || isLoading || isError) {
    return <FallbackEmptyState isLoading={isLoading} isError={isError} />
  }

  if (isFilteredEmpty) {
    return (
      <EmptyState
        search={deferredSearch}
        onClick={() => {
          setSearch("")
          setCurrPage(1)
        }}
        searchMatchType={searchMatchType}
      />
    )
  }

  if (paginatedItems.length > 0) {
    return (
      <>
        {/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- keyboard-focusable scroll container for wide tables */}
        <section
          className={compoundStyles.tableContainer()}
          tabIndex={0}
          aria-label="Scrollable table"
          onKeyDown={handleHorizontalScrollKeyDown}
        >
          <table
            className={compoundStyles.table()}
            aria-describedby={hasNonEmptyString(title) ? titleId : undefined}
          >
            <tbody>
              <tr className={compoundStyles.tableRow()}>
                {headers.slice(0, maxNoOfColumns).map((header) => (
                  <th
                    key={String(header)}
                    className={compoundStyles.tableCell({ isHeader: true })}
                  >
                    <BaseParagraph content={String(header)} />
                  </th>
                ))}
              </tr>

              {paginatedItems.map((row, rowIndex) => (
                <tr key={rowIndex} className={compoundStyles.tableRow()}>
                  {row.slice(0, maxNoOfColumns).map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={compoundStyles.tableCell({
                        isHeader: false,
                      })}
                    >
                      {/* NOTE: Reference links are NOT supported within
                          SearchableTable cell contents */}
                      <BaseParagraph content={String(cell)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
      </>
    )
  }

  return null
}

// oxlint-disable-next-line react-doctor/no-many-boolean-props -- loading/error/empty flags drive mutually exclusive views
export const SearchableTableClientUI = ({
  title,
  headers,
  isLoading = false,
  isError = false,
  search: { input: searchInput, deferred: deferredSearch, setSearch },
  page: { currPage, setCurrPage },
  isInitiallyEmpty,
  isFilteredEmpty,
  maxNoOfColumns,
  paginatedItems,
  filteredItemsLength,
  searchMatchType,
}: SearchableTableClientUIProps) => {
  const titleId = useId()

  const sectionTopRef = useRef<HTMLDivElement>(null)
  const onPageChange = () => {
    sectionTopRef.current?.scrollIntoView({
      block: "start",
    })
  }

  return (
    <div className={compoundStyles.container()} ref={sectionTopRef}>
      {hasNonEmptyString(title) && (
        <h2 id={titleId} className={compoundStyles.title()}>
          {title}
        </h2>
      )}

      <SearchField
        aria-label="Search table"
        placeholder={COPYWRITING_MAPPING[searchMatchType].searchbarPlaceholder}
        value={searchInput}
        onChange={(value) => {
          setSearch(value)
          setCurrPage(1)
        }}
      />

      <SearchableTableContent
        titleId={titleId}
        title={title}
        isInitiallyEmpty={isInitiallyEmpty}
        isLoading={isLoading}
        isError={isError}
        isFilteredEmpty={isFilteredEmpty}
        deferredSearch={deferredSearch}
        setSearch={setSearch}
        setCurrPage={setCurrPage}
        searchMatchType={searchMatchType}
        paginatedItems={paginatedItems}
        maxNoOfColumns={maxNoOfColumns}
        headers={headers}
      />

      {filteredItemsLength > 0 && (
        <div className={compoundStyles.pagination()}>
          <PaginationControls
            totalItems={filteredItemsLength}
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

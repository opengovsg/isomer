"use client"

import { useId, useRef } from "react"

import type { SearchableTableClientProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import BaseParagraph from "../../../internal/BaseParagraph"
import { PaginationControls } from "../../../internal/PaginationControls"
import { SearchField } from "../../../internal/Search"
import { COPYWRITING_MAPPING, PAGINATION_MAX_ITEMS } from "./constants"
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

interface SearchableTableClientUIProps
  extends Omit<SearchableTableClientProps, "items"> {
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

export const SearchableTableClientUI = ({
  title,
  headers,
  LinkComponent,
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

  const Content = () => {
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
                        {/* NOTE: Reference links are NOT supported within
                            SearchableTable cell contents */}
                        <BaseParagraph
                          content={String(cell)}
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
      )
    }

    return null
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
        placeholder={COPYWRITING_MAPPING[searchMatchType].searchbarPlaceholder}
        value={searchInput}
        onChange={(value) => {
          setSearch(value)
          setCurrPage(1)
        }}
      />

      <Content />

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

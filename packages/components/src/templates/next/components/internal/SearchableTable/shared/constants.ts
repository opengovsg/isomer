// This is the maximum number of columns that the table can have
// 10 was decided because at 1240px, each column will only have 124px which is
// the minimum width for a column to be readable
export const MAX_NUMBER_OF_COLUMNS = 10

export const PAGINATION_MAX_ITEMS = 10

export const HYPERLINK_EXCEL_FUNCTION = "=HYPERLINK("

interface Copywriting {
  searchbarPlaceholder: string
  noResultsSubtitle: string
}
export const COPYWRITING_MAPPING = {
  partialMatch: {
    searchbarPlaceholder: "Enter a search term",
    noResultsSubtitle:
      "Check if you have a spelling error or try a different search term.",
  },
  fullTextMatch: {
    searchbarPlaceholder: "Type a whole word to search this table",
    noResultsSubtitle:
      "Check for spelling, or type the whole word, e.g. 'water' instead of 'w'.",
  },
} as const satisfies Record<string, Copywriting>

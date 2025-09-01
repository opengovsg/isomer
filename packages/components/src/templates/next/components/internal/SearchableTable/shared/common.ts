import { tv } from "~/lib/tv"

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
    emptyState:
      "flex flex-col items-center justify-center gap-8 self-stretch px-10 py-20 pt-24",
    emptyStateHeadings: "text-center",
    emptyStateTitle: "prose-headline-lg-regular text-center",
    emptyStateSubtitle: "prose-headline-lg-regular mt-3 text-base-content",
    emptyStateButton:
      "prose-headline-base-medium text-link visited:text-link-visited hover:text-link-hover",
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
    bold: {
      true: {
        emptyStateTitle: "text-base-content-strong",
      },
      false: {
        emptyStateTitle: "text-base-content-subtle",
      },
    },
  },
})

export const compoundStyles = createSearchableTableStyles()

import type { ColumnProps } from "~/interfaces"
import { COLUMN_LAYOUT_COLUMN_COUNT } from "~/interfaces/complex/Column"
import { tv } from "~/lib/tv"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { renderComponent } from "../../../render/renderComponent"
import { ComponentContent } from "../../internal/customCssClass"

const createColumnStyles = tv({
  slots: {
    outerContainer: "",
    // Columns stack in order on narrow screens and sit side by side from the
    // tablet breakpoint up.
    container: "grid grid-cols-1 gap-7 md:gap-10",
    // Boxed blocks (Call-to-Action, Quote) render a <section> with their own
    // background, so they stretch to the row height to line up with the
    // block beside them; text and images keep their natural height.
    column: "flex min-w-0 flex-col break-words [&>section]:flex-1",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: `${ComponentContent} py-12 md:py-16`,
      },
      default: {
        outerContainer: "mt-7 first:mt-0",
      },
    },
    variant: {
      twoEqual: {
        container: "md:grid-cols-2",
      },
      oneThirdTwoThirds: {
        container: "md:grid-cols-[1fr_2fr]",
      },
      twoThirdsOneThird: {
        container: "md:grid-cols-[2fr_1fr]",
      },
      threeEqual: {
        container: "md:grid-cols-3",
      },
    },
  },
  defaultVariants: {
    layout: "default",
    variant: "twoEqual",
  },
})

// Blocks inside a column always use their compact (non-homepage) styling:
// the homepage variants of Call-to-Action and Quote are full-width sections
// that do not fit in a column.
const COLUMN_CHILD_LAYOUT: ColumnProps["layout"] = "content"

export const Column = ({
  variant,
  columns,
  layout,
  site,
  permalink,
  shouldLazyLoad,
  headingLevel,
}: ColumnProps) => {
  const styles = createColumnStyles({
    layout: getTailwindVariantLayout(layout),
    variant,
  })
  // The layout decides how many columns are shown. Any extra slot left over
  // from a previous layout is ignored rather than rendered as a stray row.
  const visibleColumns = columns.slice(0, COLUMN_LAYOUT_COLUMN_COUNT[variant])

  return (
    <section className={styles.outerContainer()}>
      <div className={styles.container()}>
        {visibleColumns.map((column, columnIndex) => (
          <div key={columnIndex} className={styles.column()}>
            {column.map((component, index) =>
              renderComponent({
                elementKey: index,
                component,
                layout: COLUMN_CHILD_LAYOUT,
                site,
                permalink,
                shouldLazyLoad,
                // A column has no title of its own, so its blocks stay at the
                // same heading level as the column.
                headingLevel,
              }),
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

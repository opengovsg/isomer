import type { HeroGradientQuickLinksProps } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { QuickLinksItem } from "./QuickLinksItem"

const QUICK_LINKS_TITLE_ID = "quick-links-title"

const quickLinksStyles = tv({
  slots: {
    root: [
      "flex h-full w-full flex-col items-start gap-6 rounded-lg border border-base-divider-subtle bg-white p-6 shadow-[0_0.375rem_1.5rem_0_rgba(0,0,0,0.10)]",
      "md:p-8",
    ],
    title: "prose-display-sm break-words text-base-content-strong",
    items: "grid w-full grid-cols-1 gap-8 md:grid-cols-2",
  },
  variants: {
    itemCount: {
      2: { items: "lg:grid-cols-2" },
      3: { items: "lg:grid-cols-3" },
      4: { items: "lg:grid-cols-4" },
    },
  },
})

type QuickLinksProps = Pick<
  HeroGradientQuickLinksProps,
  "actions" | "site" | "headingLevel"
>

export const QuickLinks = ({
  actions: { title, showIcon, items },
  site,
  headingLevel,
}: QuickLinksProps) => {
  if (items.length === 0) {
    return null
  }

  const trimmedTitle = title?.trim()
  const SectionTitleTag = getHeadingTag(headingLevel + 1)
  const itemHeadingLevel = headingLevel + (trimmedTitle ? 2 : 1)
  const itemCount = items.length as 2 | 3 | 4
  const styles = quickLinksStyles({ itemCount })

  const itemsGrid = (
    <div className={styles.items()}>
      {items.map((item, idx) => (
        <QuickLinksItem
          key={idx}
          item={item}
          showIcon={showIcon}
          site={site}
          headingLevel={itemHeadingLevel}
        />
      ))}
    </div>
  )

  return trimmedTitle ? (
    <section className={styles.root()} aria-labelledby={QUICK_LINKS_TITLE_ID}>
      <SectionTitleTag id={QUICK_LINKS_TITLE_ID} className={styles.title()}>
        {trimmedTitle}
      </SectionTitleTag>
      {itemsGrid}
    </section>
  ) : (
    <div className={styles.root()}>{itemsGrid}</div>
  )
}

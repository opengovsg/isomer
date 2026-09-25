import type { HeroActionLayoutQuickActionsPanelProps } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { QuickActionsItem } from "./QuickActionsItem"

const QUICK_ACTIONS_TITLE_ID = "quick-actions-title"

// TODO: Panel + item styling largely matches InfoCards (border, shadow, typography, link
// hover). Extract a shared `tv` style module for both blocks to avoid drift.
const quickActionsStyles = tv({
  slots: {
    root: [
      "flex h-full w-full flex-col items-start gap-6 rounded-lg border border-base-divider-subtle bg-white p-6 shadow-[0_6px_24px_0_rgba(0,0,0,0.10)]",
      "md:px-10 md:pb-9 md:pt-8",
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

export const QuickActions = ({
  quickActionsTitle,
  quickActionsItems,
  site,
  headingLevel,
}: HeroActionLayoutQuickActionsPanelProps) => {
  const items = quickActionsItems ?? []
  if (items.length === 0) {
    return null
  }

  const trimmedTitle = quickActionsTitle?.trim()
  const SectionTitleTag = getHeadingTag(headingLevel + 1)
  const itemHeadingLevel = headingLevel + (trimmedTitle ? 2 : 1)
  const itemCount = items.length as 2 | 3 | 4
  const styles = quickActionsStyles({ itemCount })

  const itemsGrid = (
    <div className={styles.items()}>
      {items.map((item, idx) => (
        <QuickActionsItem
          key={idx}
          item={item}
          site={site}
          headingLevel={itemHeadingLevel}
        />
      ))}
    </div>
  )

  return trimmedTitle ? (
    <section className={styles.root()} aria-labelledby={QUICK_ACTIONS_TITLE_ID}>
      <SectionTitleTag id={QUICK_ACTIONS_TITLE_ID} className={styles.title()}>
        {trimmedTitle}
      </SectionTitleTag>
      {itemsGrid}
    </section>
  ) : (
    <div className={styles.root()}>{itemsGrid}</div>
  )
}

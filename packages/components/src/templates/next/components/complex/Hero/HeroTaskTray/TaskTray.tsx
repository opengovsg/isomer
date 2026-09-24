import type { HeroTaskTrayProps } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"

import { TaskTrayItem } from "./TaskTrayItem"

const TASK_TRAY_TITLE_ID = "hero-task-tray-title"

const taskTrayStyles = tv({
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

type TaskTrayProps = Pick<
  HeroTaskTrayProps,
  "taskTrayTitle" | "taskTrayItems" | "site" | "headingLevel"
>

export const TaskTray = ({
  taskTrayTitle,
  taskTrayItems,
  site,
  headingLevel,
}: TaskTrayProps) => {
  const trimmedTitle = taskTrayTitle?.trim()
  const TrayTitleTag = getHeadingTag(headingLevel + 1)
  const itemHeadingLevel = headingLevel + (trimmedTitle ? 2 : 1)
  const itemCount = taskTrayItems.length as 2 | 3 | 4
  const styles = taskTrayStyles({ itemCount })

  const itemsGrid = (
    <div className={styles.items()}>
      {taskTrayItems.map((item, idx) => (
        <TaskTrayItem
          key={idx}
          item={item}
          site={site}
          headingLevel={itemHeadingLevel}
        />
      ))}
    </div>
  )

  return trimmedTitle ? (
    <section className={styles.root()} aria-labelledby={TASK_TRAY_TITLE_ID}>
      <TrayTitleTag id={TASK_TRAY_TITLE_ID} className={styles.title()}>
        {trimmedTitle}
      </TrayTitleTag>
      {itemsGrid}
    </section>
  ) : (
    <div className={styles.root()}>{itemsGrid}</div>
  )
}

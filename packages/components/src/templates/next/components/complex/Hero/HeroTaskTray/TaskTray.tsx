import type { HeroTaskTrayProps } from "~/interfaces/complex/Hero"
import { tv } from "~/lib/tv"

import { TaskTrayItem } from "./TaskTrayItem"

const gridStyles = tv({
  base: "grid grid-cols-1 gap-8 md:grid-cols-2",
  variants: {
    itemCount: {
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
    },
  },
})

interface TaskTrayProps {
  taskTrayItems: HeroTaskTrayProps["taskTrayItems"]
  site: HeroTaskTrayProps["site"]
  headingLevel: HeroTaskTrayProps["headingLevel"]
}

export const TaskTray = ({
  taskTrayItems,
  site,
  headingLevel,
}: TaskTrayProps) => {
  const itemCount = taskTrayItems.length as 2 | 3 | 4

  return (
    <div className={gridStyles({ itemCount })}>
      {taskTrayItems.map((item, idx) => (
        <TaskTrayItem
          key={idx}
          item={item}
          itemIndex={idx}
          site={site}
          headingLevel={headingLevel}
        />
      ))}
    </div>
  )
}

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

export const TaskTray = ({
  taskTrayItems,
  site,
}: Pick<HeroTaskTrayProps, "taskTrayItems" | "site">) => {
  const itemCount = taskTrayItems.length as 2 | 3 | 4

  return (
    <div className={gridStyles({ itemCount })}>
      {taskTrayItems.map((item, idx) => (
        <TaskTrayItem key={idx} item={item} site={site} />
      ))}
    </div>
  )
}

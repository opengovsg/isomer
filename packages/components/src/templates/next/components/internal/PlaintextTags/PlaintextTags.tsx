import { Fragment } from "react"

import { TagSeparator } from "../TagSeparator"

interface PlaintextTagsProps {
  tags?: { category: string; selected: string[] }[]
  className?: string
}

export const PlaintextTags = ({ tags = [], className }: PlaintextTagsProps) => {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {tags.map(({ category, selected }, index) => (
        <Fragment key={category}>
          {index > 0 && <TagSeparator />}
          <span>{selected.join(", ")}</span>
        </Fragment>
      ))}
    </div>
  )
}

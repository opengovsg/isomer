import type { TagGroup } from "~/types"

import { Tag } from "../Tag"

interface PillTagsProps {
  tags?: TagGroup[]
  // NOTE: Applied to each tag-category row (category label + its pills).
  className?: string
  // NOTE: Applied to the wrapper around all rows — only needed when a caller
  // wants spacing between multiple stacked groups.
  containerClassName?: string
}

export const PillTags = ({
  tags = [],
  className,
  containerClassName,
}: PillTagsProps) => {
  if (tags.length === 0) {
    return null
  }

  const rows = tags.map(({ id, category, selected }) => (
    <div key={id ?? category} className={className}>
      <p className="prose-label-sm">{category}</p>
      {selected.map((label) => (
        <Tag key={label}>{label}</Tag>
      ))}
    </div>
  ))

  if (!containerClassName) {
    return rows
  }

  return <div className={containerClassName}>{rows}</div>
}

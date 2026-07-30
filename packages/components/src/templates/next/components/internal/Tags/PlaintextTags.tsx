import type { TagGroup } from "~/types"
import { Fragment } from "react"
import { twMerge } from "~/lib/twMerge"

interface PlaintextTagsProps {
  tags?: TagGroup[]
  className?: string
}

export const PlaintextTags = ({ tags = [], className }: PlaintextTagsProps) => {
  if (tags.length === 0) {
    return null
  }

  return (
    <div className={twMerge("flex flex-wrap items-center gap-2", className)}>
      {tags.map(({ id, category, selected }, index) => (
        <Fragment key={id ?? category}>
          {index > 0 && <TagSeparator />}
          <span>{selected.join(", ")}</span>
        </Fragment>
      ))}
    </div>
  )
}

// NOTE: CSS-only middot — a styled div instead of an SVG, so it isn't a
// separate asset re-fetched per separator when a page has multiple groups.
const TagSeparator = () => {
  return (
    <div
      aria-hidden
      className="h-0.5 w-0.5 shrink-0 rounded-full bg-base-content"
    />
  )
}

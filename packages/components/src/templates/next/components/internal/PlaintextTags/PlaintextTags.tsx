import { Fragment } from "react"

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

const TagSeparator = () => {
  return (
    <svg
      width="2"
      height="2"
      viewBox="0 0 2 2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0"
    >
      <circle cx="1" cy="1" r="1" fill="#374151" />
    </svg>
  )
}

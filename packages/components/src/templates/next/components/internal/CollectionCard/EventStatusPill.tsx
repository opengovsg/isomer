import type { DateFilterStatusId } from "~/types/constants"
import { DATE_FILTER_STATUS_ID } from "~/types/constants"

// Figma-specified status colours (wayfinder ticket 005).
const STATUS_STYLES: Record<DateFilterStatusId, string> = {
  [DATE_FILTER_STATUS_ID.Upcoming]: "bg-[#358257] text-white",
  [DATE_FILTER_STATUS_ID.Ongoing]: "bg-[#A88651] text-white",
  [DATE_FILTER_STATUS_ID.Ended]: "bg-[#E6E6E6] text-base-content",
}

interface EventStatusPillProps {
  status: DateFilterStatusId
  label: string
}

export const EventStatusPill = ({ status, label }: EventStatusPillProps) => {
  return (
    <div
      className={`inline-flex items-center justify-center gap-2 rounded px-2 py-1 ${STATUS_STYLES[status]}`}
    >
      <p className="prose-label-sm-medium line-clamp-1">{label}</p>
    </div>
  )
}

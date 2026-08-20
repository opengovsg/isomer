import type { DateFilterStatusId } from "~/types/constants"
import { DATE_FILTER_STATUS_ID } from "~/types/constants"

// Reuses existing `utility-feedback` design tokens rather than inventing new
// colors: ended = neutral (matches the existing `Tag` pill's default look),
// ongoing = warning (draws attention — "happening now"), upcoming = info
// (calm, "coming soon"). See wayfinder ticket 005.
const STATUS_STYLES: Record<DateFilterStatusId, string> = {
  [DATE_FILTER_STATUS_ID.Ended]:
    "bg-base-canvas-backdrop text-base-content-subtle",
  [DATE_FILTER_STATUS_ID.Ongoing]:
    "bg-utility-feedback-warning-subtle text-utility-feedback-warning",
  [DATE_FILTER_STATUS_ID.Upcoming]:
    "bg-utility-feedback-info-subtle text-utility-feedback-info",
}

interface EventStatusPillProps {
  status: DateFilterStatusId
  label: string
}

export const EventStatusPill = ({ status, label }: EventStatusPillProps) => {
  return (
    <div
      className={`w-fit items-center justify-center rounded-full px-1.5 py-0.5 ${STATUS_STYLES[status]}`}
    >
      <p className="prose-label-sm-medium line-clamp-1">{label}</p>
    </div>
  )
}

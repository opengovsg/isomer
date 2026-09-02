import type { DateFilterStatusId } from "~/types/constants"
import { tv } from "~/lib/tv"
import { DATE_FILTER_STATUS } from "~/types/constants"

// Fixed hex from design spec, not theme tokens.
const STATUS_VARIANT_CLASSES = {
  [DATE_FILTER_STATUS.Upcoming.id]: "bg-[#358257] text-white",
  [DATE_FILTER_STATUS.Ongoing.id]: "bg-[#A88651] text-white",
  [DATE_FILTER_STATUS.Ended.id]: "bg-[#E6E6E6] text-base-content",
} satisfies Record<DateFilterStatusId, string>

const statusPillStyles = tv({
  base: "inline-flex items-center justify-center gap-2 rounded px-2 py-1",
  variants: {
    status: STATUS_VARIANT_CLASSES,
  },
})

interface DateFilterStatusPillProps {
  status: DateFilterStatusId
  label: string
}

export const DateFilterStatusPill = ({
  status,
  label,
}: DateFilterStatusPillProps) => {
  return (
    <div className={statusPillStyles({ status })}>
      <p className="prose-label-sm-medium line-clamp-1">{label}</p>
    </div>
  )
}

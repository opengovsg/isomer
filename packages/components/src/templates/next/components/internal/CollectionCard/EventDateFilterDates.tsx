import type { DateFilterCard } from "~/interfaces/internal/CollectionCard"
import { BiCalendar } from "react-icons/bi"

interface EventDateFilterDatesProps {
  entries: DateFilterCard[]
}

export const EventDateFilterDates = ({
  entries,
}: EventDateFilterDatesProps) => {
  if (entries.length === 0) {
    return null
  }

  if (entries.length === 1) {
    const { dateText } = entries[0]!

    return (
      <div className="flex items-center gap-2">
        <BiCalendar
          aria-hidden
          className="h-5 w-5 shrink-0 text-base-content-subtle"
        />
        <p className="prose-label-md-medium text-base-content">{dateText}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-x-4">
      {entries.map(({ id, label, dateText }) => (
        <div key={id}>
          <p className="prose-label-sm-regular text-base-content-subtle">
            {label}
          </p>
          <p className="prose-label-md-medium text-base-content">{dateText}</p>
        </div>
      ))}
    </div>
  )
}

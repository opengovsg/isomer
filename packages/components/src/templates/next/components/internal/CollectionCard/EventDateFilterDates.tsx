import type { DateFilterCard } from "~/interfaces/internal/CollectionCard"

interface EventDateFilterDatesProps {
  entries: DateFilterCard[]
}

// Underneath the title: one label+date block per date filter the item has a
// value for, laid out in a 2-column grid to stay compact when there are
// several. See wayfinder ticket 005.
export const EventDateFilterDates = ({
  entries,
}: EventDateFilterDatesProps) => {
  if (entries.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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

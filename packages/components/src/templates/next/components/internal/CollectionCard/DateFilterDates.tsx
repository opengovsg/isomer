import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"

interface DateFilterDatesProps {
  entries?: DateFilterDisplayEntry[]
}

export const DateFilterDates = ({ entries }: DateFilterDatesProps) => {
  if (!entries || entries.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-5">
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

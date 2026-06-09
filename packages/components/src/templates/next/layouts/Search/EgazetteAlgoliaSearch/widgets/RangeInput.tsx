import { useState } from "react"
import { useRange } from "react-instantsearch"

interface RangeInputProps {
  attribute: string
  minLabel: string
  maxLabel: string
}

const toInputValue = (value: number | undefined) =>
  value === undefined || !Number.isFinite(value) ? "" : String(value)

export const RangeInput = ({
  attribute,
  minLabel,
  maxLabel,
}: RangeInputProps) => {
  const { start, range, refine, canRefine } = useRange({ attribute })
  const [minRaw] = start
  const [, maxRaw] = start

  const [min, setMin] = useState(toInputValue(minRaw))
  const [max, setMax] = useState(toInputValue(maxRaw))

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const minNum = min === "" ? undefined : Number(min)
    const maxNum = max === "" ? undefined : Number(max)
    refine([minNum, maxNum])
  }

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <label className="flex flex-1 flex-col gap-1">
        <span className="prose-body-sm text-base-content">{minLabel}</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder={range.min !== undefined ? String(range.min) : undefined}
          value={min}
          onChange={(event) => setMin(event.target.value)}
          disabled={!canRefine}
          className="h-10 w-full rounded border border-base-content-strong bg-white px-2"
        />
      </label>
      <label className="flex flex-1 flex-col gap-1">
        <span className="prose-body-sm text-base-content">{maxLabel}</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder={range.max !== undefined ? String(range.max) : undefined}
          value={max}
          onChange={(event) => setMax(event.target.value)}
          disabled={!canRefine}
          className="h-10 w-full rounded border border-base-content-strong bg-white px-2"
        />
      </label>
      <button
        type="submit"
        disabled={!canRefine}
        className="prose-headline-base-medium h-10 rounded border border-base-content-strong bg-white px-3 text-base-content disabled:opacity-50"
      >
        Go
      </button>
    </form>
  )
}

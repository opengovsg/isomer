import { useEffect, useState } from "react"
import { useRange } from "react-instantsearch"
import { tv } from "~/lib/tv"

interface RangeInputProps {
  attribute: string
  minLabel: string
  maxLabel: string
  /** Inclusive lower bound each value must satisfy. */
  bound?: { min?: number; max?: number }
}

const inputStyles = tv({
  base: "h-10 w-full rounded border bg-white px-2 disabled:cursor-not-allowed",
  variants: {
    hasError: {
      true: "border-utility-feedback-alert",
      false: "border-base-content-strong",
    },
  },
})

const toInputValue = (value: number | undefined) =>
  value === undefined || !Number.isFinite(value) ? "" : String(value)

const validate = (
  minNum: number | undefined,
  maxNum: number | undefined,
  bound: { min?: number; max?: number } | undefined,
): string | undefined => {
  const checkBound = (value: number | undefined, label: string) => {
    if (value === undefined) return undefined
    if (bound?.min !== undefined && value < bound.min)
      return `${label} must be ${bound.min} or later`
    if (bound?.max !== undefined && value > bound.max)
      return `${label} must be ${bound.max} or earlier`
    return undefined
  }

  return (
    checkBound(minNum, "From") ??
    checkBound(maxNum, "To") ??
    (minNum !== undefined && maxNum !== undefined && minNum > maxNum
      ? `"From" cannot be later than "To"`
      : undefined)
  )
}

export const RangeInput = ({
  attribute,
  minLabel,
  maxLabel,
  bound,
}: RangeInputProps) => {
  // `bound` is optional: when omitted, useRange derives min/max from the
  // attribute's facet stats. Pass explicit bounds only to refine an attribute
  // that lacks facet stats, or to clamp refinements to [min, max] at the
  // connector level.
  const { start, range, refine, canRefine } = useRange({
    attribute,
    min: bound?.min,
    max: bound?.max,
  })
  const [minRaw, maxRaw] = start

  // Validate against the range Algolia derived from the attribute's facet stats
  // when no explicit `bound` was passed. Without this a visitor can submit a
  // year/month outside the data's range — a filter that matches nothing.
  const effectiveBound = {
    min: bound?.min ?? range.min,
    max: bound?.max ?? range.max,
  }

  const [min, setMin] = useState(toInputValue(minRaw))
  const [max, setMax] = useState(toInputValue(maxRaw))
  const [error, setError] = useState<string>()

  // Keep the inputs in sync when the active refinement changes outside of this
  // form (URL hydration on deep-links, "Clear refinements", browser back/forward).
  // Without this the inputs would show stale values that no longer match the
  // applied filters. `minRaw`/`maxRaw` are stable primitives, so the effect only
  // fires when the refinement actually changes.
  useEffect(() => {
    setMin(toInputValue(minRaw))
    setMax(toInputValue(maxRaw))
    // An external refinement change (e.g. "Clear refinements") makes any prior
    // validation error stale, so reset it alongside the inputs.
    setError(undefined)
  }, [minRaw, maxRaw])

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const minNum = min === "" ? undefined : Number(min)
    const maxNum = max === "" ? undefined : Number(max)
    if (
      (minNum !== undefined && Number.isNaN(minNum)) ||
      (maxNum !== undefined && Number.isNaN(maxNum))
    ) {
      setError("Please enter a valid number")
      return
    }
    const validationError = validate(minNum, maxNum, effectiveBound)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(undefined)
    refine([minNum, maxNum])
  }

  const inputClassName = inputStyles({ hasError: error !== undefined })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1">
          <span className="prose-body-sm text-base-content">{minLabel}</span>
          <input
            type="number"
            inputMode="numeric"
            min={bound?.min}
            max={bound?.max}
            placeholder={
              range.min !== undefined ? String(range.min) : undefined
            }
            value={min}
            onChange={(event) => setMin(event.target.value)}
            disabled={!canRefine}
            aria-invalid={error !== undefined}
            className={inputClassName}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="prose-body-sm text-base-content">{maxLabel}</span>
          <input
            type="number"
            inputMode="numeric"
            min={bound?.min}
            max={bound?.max}
            placeholder={
              range.max !== undefined ? String(range.max) : undefined
            }
            value={max}
            onChange={(event) => setMax(event.target.value)}
            disabled={!canRefine}
            aria-invalid={error !== undefined}
            className={inputClassName}
          />
        </label>
        <button
          type="submit"
          disabled={!canRefine}
          className="prose-headline-base-medium h-10 rounded border border-base-content-strong bg-white px-3 text-base-content disabled:cursor-not-allowed disabled:opacity-50"
        >
          Go
        </button>
      </div>
      {error ? (
        <span
          role="alert"
          className="prose-body-sm text-utility-feedback-alert"
        >
          {error}
        </span>
      ) : null}
    </form>
  )
}

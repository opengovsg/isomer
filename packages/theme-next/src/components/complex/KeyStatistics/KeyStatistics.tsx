import type { KeyStatisticsProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"

const MAX_ITEMS = 4

const ITEM_WIDTHS: Record<number, string> = {
  1: "basis-full",
  2: "basis-[calc((100%-2.5rem)/2)]",
  3: "basis-[calc((100%-5rem)/3)] md:max-w-[calc((100%-2.5rem)/2)]",
  4: "basis-[calc((100%-7.5rem)/4)] md:max-w-[calc((100%-5rem)/3)]",
}

// This is the maximum number of characters in a key statistic value
// This is required because we make all columns have the same width. If there is
// a value that is very large relative to the other values, then there will be
// a lot of weird white space. 7 characters should fit most use-cases.
// Example: +$1.23M, +235.2%, $123.4B
const MAX_CHAR_LIMIT = 7

const KeyStatistics = ({ title, statistics }: KeyStatisticsProps) => {
  return (
    <div
      className={`${ComponentContent} flex flex-col gap-10 py-12 xs:py-24 lg:gap-24`}
    >
      <h2 className="prose-display-md w-full max-w-[47.5rem] text-base-content-strong">
        {title}
      </h2>
      <div className="flex flex-col flex-wrap gap-x-8 gap-y-12 md:flex-row">
        {statistics.slice(0, MAX_ITEMS).map(({ label, value }, index) => (
          <div
            key={index}
            className={`flex grow flex-col gap-3 ${
              ITEM_WIDTHS[Math.min(MAX_ITEMS, statistics.length)]
            }`}
          >
            <h3 className="prose-display-lg text-pretty text-brand-canvas-inverse">
              {value.slice(0, MAX_CHAR_LIMIT)}
            </h3>
            <p className="prose-label-md-medium text-base-content-subtle">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyStatistics

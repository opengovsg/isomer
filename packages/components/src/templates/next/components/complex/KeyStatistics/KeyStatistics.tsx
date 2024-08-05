import type { KeyStatisticsProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"

const MAX_ITEMS = 4

// This is the maximum number of characters in a key statistic value
// This is required because we make all columns have the same width. If there is
// a value that is very large relative to the other values, then there will be
// a lot of weird white space. 7 characters should fit most use-cases.
// Example: +$1.23M, +235.2%, $123.4B
const MAX_CHAR_LIMIT = 7

const KeyStatistics = ({ title, statistics }: KeyStatisticsProps) => {
  return (
    <div
      className={`${ComponentContent} flex flex-col gap-16 py-12 xs:py-24 lg:gap-24`}
    >
      <h2 className="prose-display-md w-full max-w-[47.5rem] text-base-content-strong">
        {title}
      </h2>
      <div className="flex flex-col flex-wrap gap-x-8 gap-y-10 md:flex-row">
        {statistics.slice(0, MAX_ITEMS).map(({ label, value }) => (
          <div
            className={`flex max-w-[50%] grow flex-col gap-3 md:basis-1/3 lg:basis-0`}
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

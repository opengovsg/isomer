import type { KeyStatisticsProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"

const ITEM_WIDTHS: Record<
  KeyStatisticsProps["variant"],
  Record<number, string>
> = {
  side: {
    1: "basis-full",
    2: "basis-[calc((100%-2.5rem)/2)]",
    3: "basis-[calc((100%-5rem)/3)] md:max-w-[calc((100%-2.5rem)/2)]",
  },
  top: {
    1: "basis-full",
    2: "basis-[calc((100%-2.5rem)/2)]",
    3: "basis-[calc((100%-5rem)/3)] md:max-w-[calc((100%-2.5rem)/2)]",
    4: "basis-[calc((100%-7.5rem)/4)] md:max-w-[calc((100%-5rem)/3)]",
  },
}

// This is the maximum number of characters in a key statistic value
// This is required because we make all columns have the same width. If there is
// a value that is very large relative to the other values, then there will be
// a lot of weird white space. 7 characters should fit most use-cases.
// Example: +$1.23M, +235.2%, $123.4B
const MAX_CHAR_LIMIT = 7

const KeyStatistics = ({ variant, title, statistics }: KeyStatisticsProps) => {
  const maxItems = variant === "side" ? 3 : 4

  return (
    <section>
      <div
        className={`${ComponentContent} flex flex-col px-5 py-12 xs:px-10 xs:py-24 gap-10 ${
          variant === "side" ? "lg:flex-row lg:gap-16" : ""
        }`}
      >
        <h2
          className={`text-2xl xs:text-4xl xs:leading-[2.75rem] text-content font-semibold w-full ${
            variant === "side" ? "lg:w-1/3" : ""
          }`}
        >
          {title}
        </h2>
        <div className="flex flex-wrap flex-col md:flex-row gap-10">
          {statistics.slice(0, maxItems).map(({ label, value }) => (
            <div
              className={`flex flex-col gap-3 grow ${
                ITEM_WIDTHS[variant][Math.min(maxItems, statistics.length)]
              }`}
            >
              <h3 className="text-4xl xs:text-5xl leading-[2.75rem] xs:leading-[3.5rem] text-content-strong font-semibold text-pretty">
                {value.slice(0, MAX_CHAR_LIMIT)}
              </h3>
              <p className="text-sm text-content-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default KeyStatistics

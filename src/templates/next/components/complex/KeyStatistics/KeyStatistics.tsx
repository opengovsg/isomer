import type { KeyStatisticsProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"

const KeyStatistics = ({ variant, title, statistics }: KeyStatisticsProps) => {
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
        <div className="flex flex-col md:flex-row gap-10">
          {statistics
            .slice(0, variant === "side" ? 3 : 4)
            .map(({ label, value }) => (
              <div className="flex flex-col gap-3">
                <h3 className="text-4xl xs:text-5xl leading-[2.75rem] xs:leading-[3.5rem] text-content-strong font-semibold">
                  {value}
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

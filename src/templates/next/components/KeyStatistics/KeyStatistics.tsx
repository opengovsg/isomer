import { type KeyStatisticsProps } from "~/common"

const KeyStatistics = ({ variant, title, statistics }: KeyStatisticsProps) => {
  return (
    <div
      className={`flex flex-col px-5 py-12 xs:px-10 xs:py-24 gap-10 ${
        variant === "side" ? "lg:flex-row lg:gap-16" : ""
      }`}
    >
      <h2
        className={`text-2xl xs:text-4xl xs:leading-[2.75rem] text-[#333333] font-semibold w-full ${
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
              <h3 className="text-5xl leading-[3.5rem] text-[#2c2e34] font-semibold">
                {value}
              </h3>
              <p className="text-sm text-[#5d5d5d]">{label}</p>
            </div>
          ))}
      </div>
    </div>
  )
}

export default KeyStatistics

import { type KeyStatisticsProps } from "~/common"

const KeyStatistics = ({ variant, title, statistics }: KeyStatisticsProps) => {
  return (
    <div
      className={`flex flex-col gap-10 ${
        variant === "side" ? "lg:flex-row lg:gap-16" : ""
      } gap-10`}
    >
      <h2
        className={`text-4xl leading-[3rem] w-full ${
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
              <h3 className="text-5xl leading-[3.5rem]">{value}</h3>
              <p className="text-sm text-[#5d5d5d]">{label}</p>
            </div>
          ))}
      </div>
    </div>
  )
}

export default KeyStatistics

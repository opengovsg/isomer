import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"
import type { InfoColsProps } from "~/interfaces"

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="flex flex-col gap-4">
    {subtitle && (
      <p className="text-subtitle uppercase tracking-widest">{subtitle}</p>
    )}
    <h1 className="text-site-secondary text-5xl font-semibold leading-tight">
      {title}
    </h1>
  </div>
)

const InfoBoxes = ({ infoBoxes }: Pick<InfoColsProps, "infoBoxes">) => {
  const mdColsClass =
    infoBoxes.length === 1 ? "md:grid-cols-1" : "md:grid-cols-2"

  // Follows current behaviour: if there are 4 info boxes, xl screen should stay at 2 columns instead of going up to 3
  const xlColsClass =
    infoBoxes.length === 1
      ? "xl:grid-cols-1"
      : infoBoxes.length % 2 === 0
        ? "xl:grid-cols-2"
        : "xl:grid-cols-3"

  return (
    <div
      className={`grid grid-cols-1 gap-4 justify-between ${mdColsClass} ${xlColsClass}`}
    >
      {infoBoxes.map((infoBox, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-4 p-6 items-center text-center md:items-start md:text-left"
        >
          <h3 className="text-3xl font-bold text-subtitle">{infoBox.title}</h3>
          <p className="text-paragraph text-xl">{infoBox.description}</p>
        </div>
      ))}
    </div>
  )
}

const InfoColsFooter = ({
  buttonLabel,
  buttonUrl,
}: Pick<InfoColsProps, "buttonLabel" | "buttonUrl">) => {
  return (
    buttonLabel &&
    buttonUrl && (
      <div className="text-lg font-semibold uppercase">
        <a
          className="flex gap-2 text-site-secondary font-semibold text-center underline uppercase tracking-wide"
          href={buttonUrl}
          target={buttonUrl.startsWith("http") ? "_blank" : undefined}
          rel={
            buttonUrl.startsWith("http")
              ? "noopener noreferrer nofollow"
              : undefined
          }
        >
          {buttonLabel}
          <div className="my-auto">
            <ArrowRightIcon className="text-site-secondary size-5" />
          </div>
        </a>
      </div>
    )
  )
}

const InfoCols = ({
  sectionIdx,
  title,
  subtitle,
  buttonLabel,
  buttonUrl,
  infoBoxes,
}: InfoColsProps) => {
  return (
    <HomepageSectionWrapper sectionIndex={sectionIdx}>
      <section className="py-24 px-8 sm:px-16 md:px-24">
        <div className="flex flex-col gap-12 items-center mx-auto text-center">
          <InfoColsHeader title={title} subtitle={subtitle} />
          <InfoBoxes infoBoxes={infoBoxes} />
          <InfoColsFooter buttonLabel={buttonLabel} buttonUrl={buttonUrl} />
        </div>
      </section>
    </HomepageSectionWrapper>
  )
}

export default InfoCols

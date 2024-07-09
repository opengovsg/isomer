import { BiRightArrowAlt } from "react-icons/bi"

import type { InfoColsProps } from "~/interfaces"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="flex flex-col gap-4">
    {subtitle && (
      <p className="uppercase tracking-widest text-subtitle">{subtitle}</p>
    )}
    <h1 className="text-5xl font-semibold leading-tight text-site-secondary">
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
      className={`grid grid-cols-1 justify-between gap-4 ${mdColsClass} ${xlColsClass}`}
    >
      {infoBoxes.map((infoBox, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center gap-4 p-6 text-center md:items-start md:text-left"
        >
          <h3 className="text-3xl font-bold text-subtitle">{infoBox.title}</h3>
          <p className="text-xl text-paragraph">{infoBox.description}</p>
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
          className="flex gap-2 text-center font-semibold uppercase tracking-wide text-site-secondary underline"
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
            <BiRightArrowAlt className="size-5 text-site-secondary" />
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
      <section className="px-8 py-24 sm:px-16 md:px-24">
        <div className="mx-auto flex flex-col items-center gap-12 text-center">
          <InfoColsHeader title={title} subtitle={subtitle} />
          <InfoBoxes infoBoxes={infoBoxes} />
          <InfoColsFooter buttonLabel={buttonLabel} buttonUrl={buttonUrl} />
        </div>
      </section>
    </HomepageSectionWrapper>
  )
}

export default InfoCols

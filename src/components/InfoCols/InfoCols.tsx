import { ArrowRightIcon } from "@heroicons/react/24/outline"
import { HomepageSectionWrapper } from "../HomepageSectionWrapper"

interface InfoBox {
  title: string
  description?: string
}

export interface InfoColsProps {
  sectionIdx?: number
  title: string
  subtitle?: string
  buttonLabel?: string
  buttonUrl?: string
  infoBoxes: InfoBox[] // 1-4 info boxes
}

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="flex flex-col gap-4">
    {subtitle && (
      <p className="text-subtitle uppercase tracking-widest">{subtitle}</p>
    )}
    <h1 className="text-secondary text-5xl font-semibold leading-tight">
      {title}
    </h1>
  </div>
)

const InfoBoxes = ({ infoBoxes }: Pick<InfoColsProps, "infoBoxes">) => {
  const mdCols = Math.min(infoBoxes.length, 2)
  // Follows current behaviour: if there are 4 info boxes, xl screen should stay at 2 columns instead of going up to 3
  const xlCols = infoBoxes.length === 4 ? 2 : Math.min(infoBoxes.length, 3)
  return (
    <div>
      <div
        className={`grid grid-cols-1 gap-4 justify-between md:grid-cols-${mdCols} xl:grid-cols-${xlCols}`}
      >
        {infoBoxes.map((infoBox, idx) => (
          <div
            key={idx}
            className="flex flex-col gap-4 p-6 items-center text-center md:items-start md:text-left"
          >
            <h3 className="text-3xl font-bold text-subtitle">
              {infoBox.title}
            </h3>
            <p className="text-paragraph text-xl">{infoBox.description}</p>
          </div>
        ))}
      </div>
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
          className="flex gap-2 text-secondary font-semibold text-center underline uppercase tracking-wide"
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
            <ArrowRightIcon className="text-secondary size-5" />
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

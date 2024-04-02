import { InfoColsProps } from "~/common"
import { SUPPORTED_ICONS_MAP, SupportedIconName } from "~/common/Icons"
import { Heading } from "../../typography/Heading"
import { Paragraph } from "../../typography/Paragraph"
import Button from "../Button"
import { ComponentContent } from "../shared/customCssClass"

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="w-full flex flex-col gap-7 items-start text-left">
    <h2 className={`text-content-strong ${Heading[3]}`}>{title}</h2>
    {subtitle && <p className={`text-content ${Paragraph[2]}`}>{subtitle}</p>}
  </div>
)

const InfoBoxIcon = ({ icon }: { icon?: SupportedIconName }) => {
  if (!icon) return null
  const Icon = SUPPORTED_ICONS_MAP[icon]
  return (
    <div>
      <Icon className="w-10 h-auto text-site-primary" />
    </div>
  )
}

const InfoBoxes = ({
  infoBoxes,
  LinkComponent,
}: Pick<InfoColsProps, "infoBoxes" | "LinkComponent">) => {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-9 md:grid-cols-2 xl:grid-cols-3">
      {infoBoxes.map((infoBox, idx) => (
        <div key={idx} className="flex flex-col gap-5 items-start text-left">
          <InfoBoxIcon icon={infoBox.icon} />
          <div className="flex flex-col gap-4 items-start text-left">
            <div className="flex flex-col gap-4 items-start text-content-strong">
              <h3 className={`${Heading[5]} text-content-strong`}>
                {infoBox.title}
              </h3>
              <p className={`${Paragraph[2]} text-content`}>
                {infoBox.description}
              </p>
            </div>
          </div>
          {infoBox.buttonLabel && infoBox.buttonUrl && (
            <Button
              label={infoBox.buttonLabel}
              href={infoBox.buttonUrl}
              variant="link"
              rightIcon="right-arrow"
            />
          )}
        </div>
      ))}
    </div>
  )
}

const InfoCols = ({
  backgroundColor,
  title,
  subtitle,
  infoBoxes,
  LinkComponent = "a",
}: InfoColsProps) => {
  const bgColor = backgroundColor === "gray" ? "bg-gray-100" : "bg-white"
  return (
    <section className={bgColor}>
      <div className={`${ComponentContent} py-24 px-8 sm:px-16 lg:px-24`}>
        <div className="flex flex-col gap-12">
          <InfoColsHeader title={title} subtitle={subtitle} />
          <InfoBoxes infoBoxes={infoBoxes} LinkComponent={LinkComponent} />
        </div>
      </div>
    </section>
  )
}

export default InfoCols

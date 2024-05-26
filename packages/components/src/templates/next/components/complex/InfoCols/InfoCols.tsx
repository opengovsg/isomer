import { SUPPORTED_ICONS_MAP, SupportedIconName } from "~/common/icons"
import type { InfoColsProps } from "~/interfaces"
import { ComponentContent } from "../../internal/customCssClass"
import Button from "../Button"

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="flex w-full flex-col items-start gap-7 text-left">
    <h2 className="text-heading-03 text-content-strong">{title}</h2>
    {subtitle && <p className="text-paragraph-02 text-content">{subtitle}</p>}
  </div>
)

const InfoBoxIcon = ({ icon }: { icon?: SupportedIconName }) => {
  if (!icon) return null
  const Icon = SUPPORTED_ICONS_MAP[icon]
  return (
    <div>
      <Icon className="h-auto w-10 text-site-primary" />
    </div>
  )
}

const InfoBoxes = ({
  infoBoxes,
  LinkComponent,
}: Pick<InfoColsProps, "infoBoxes" | "LinkComponent">) => {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
      {infoBoxes.map((infoBox, idx) => (
        <div key={idx} className="flex flex-col items-start gap-5 text-left">
          <InfoBoxIcon icon={infoBox.icon} />
          <div className="flex flex-col items-start gap-4 text-left">
            <div className="flex flex-col items-start gap-4 text-content-strong">
              <h3 className="text-heading-04 text-content-strong">
                {infoBox.title}
              </h3>
              <p className="text-paragraph-02 text-content">
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
      <div className={`${ComponentContent} py-24`}>
        <div className="flex flex-col gap-12">
          <InfoColsHeader title={title} subtitle={subtitle} />
          <InfoBoxes infoBoxes={infoBoxes} LinkComponent={LinkComponent} />
        </div>
      </div>
    </section>
  )
}

export default InfoCols

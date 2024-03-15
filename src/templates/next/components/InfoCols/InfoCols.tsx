import { BiRightArrowAlt } from "react-icons/bi"
import { InfoColsProps } from "~/common"
import { SUPPORTED_ICONS_MAP, SupportedIconName } from "~/common/Icons"

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="w-full flex flex-col gap-7 items-start text-left">
    <h1 className="text-content-default text-4xl font-normal leading-tight">
      {title}
    </h1>
    {subtitle && <p className="text-xl font-normal">{subtitle}</p>}
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
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
      {infoBoxes.map((infoBox, idx) => (
        <div key={idx} className="flex flex-col gap-4 items-start text-left">
          <InfoBoxIcon icon={infoBox.icon} />
          <div className="flex flex-col gap-1 items-start text-content-strong">
            <h3 className="font-bold">{infoBox.title}</h3>
            <p>{infoBox.description}</p>
          </div>
          {infoBox.buttonLabel && infoBox.buttonUrl && (
            <LinkComponent
              className="flex flex-row gap-1 items-center underline underline-offset-2 text-secondary text-sm"
              href={infoBox.buttonUrl}
              target={
                infoBox.buttonUrl?.startsWith("http") ? "_blank" : undefined
              }
              rel={
                infoBox.buttonUrl?.startsWith("http")
                  ? "noopener noreferrer nofollow"
                  : undefined
              }
            >
              {infoBox.buttonLabel}
              <BiRightArrowAlt className="size-6" />
            </LinkComponent>
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
    <section className={`py-24 px-8 sm:px-16 lg:px-24 ${bgColor}`}>
      <div className="flex flex-col gap-16">
        <InfoColsHeader title={title} subtitle={subtitle} />
        <InfoBoxes infoBoxes={infoBoxes} LinkComponent={LinkComponent} />
      </div>
    </section>
  )
}

export default InfoCols

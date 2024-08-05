import { BiRightArrowAlt } from "react-icons/bi"

import type { SupportedIconName } from "~/common/icons"
import type { InfoColsProps } from "~/interfaces"
import { SUPPORTED_ICONS_MAP } from "~/common/icons"
import { ComponentContent } from "../../internal/customCssClass"

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="flex w-full max-w-[47.5rem] flex-col items-start gap-7 text-left">
    <h2 className="text-2xl font-semibold text-content-strong sm:text-4xl">
      {title}
    </h2>
    {subtitle && (
      <p className="text-sm text-content text-paragraph-02 sm:text-lg">
        {subtitle}
      </p>
    )}
  </div>
)

const InfoBoxIcon = ({ icon }: { icon?: SupportedIconName }) => {
  if (!icon) return null
  const Icon = SUPPORTED_ICONS_MAP[icon]
  return (
    <div>
      <Icon className="h-auto w-6 text-base-content-strong group-hover:text-brand-interaction" />
    </div>
  )
}

const InfoBoxes = ({
  infoBoxes,
}: Pick<InfoColsProps, "infoBoxes" | "LinkComponent">) => {
  return (
    <div className="grid grid-cols-1 gap-x-28 gap-y-20 md:grid-cols-2 xl:grid-cols-3">
      {infoBoxes.map((infoBox, idx) => (
        <a
          href={infoBox.buttonUrl}
          key={idx}
          className="group flex flex-col items-start gap-3 text-left"
        >
          <InfoBoxIcon icon={infoBox.icon} />
          <h3 className="prose-headline-lg-semibold text-base-content-strong group-hover:text-brand-interaction">
            {infoBox.title}
          </h3>
          <p className="text-base-content-default prose-body-base">
            {infoBox.description}
          </p>
          <div className="prose-headline-base-medium inline-flex items-center gap-1 text-base-content-strong">
            {infoBox.buttonLabel}
            <BiRightArrowAlt className="text-[1.375rem] transition ease-in group-hover:translate-x-1" />
          </div>
        </a>
      ))}
    </div>
  )
}

const InfoCols = ({
  title,
  subtitle,
  infoBoxes,
  LinkComponent = "a",
}: InfoColsProps) => {
  return (
    <section className="bg-white">
      <div className={`${ComponentContent} py-24`}>
        <div className="flex flex-col gap-24">
          <InfoColsHeader title={title} subtitle={subtitle} />
          <InfoBoxes infoBoxes={infoBoxes} LinkComponent={LinkComponent} />
        </div>
      </div>
    </section>
  )
}

export default InfoCols

"use client"

import { BiRightArrowAlt } from "react-icons/bi"

import type { SupportedIconName } from "~/common/icons"
import type { InfoColsProps } from "~/interfaces"
import { SUPPORTED_ICONS_MAP } from "~/common/icons"
import { tv } from "~/lib/tv"
import { groupFocusVisibleHighlightNonRac } from "~/utils/rac"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const InfoColsHeader = ({
  title,
  subtitle,
}: Pick<InfoColsProps, "title" | "subtitle">) => (
  <div className="flex w-full max-w-[47.5rem] flex-col items-start gap-2.5 text-left">
    <h2 className="prose-display-md text-base-content-strong">{title}</h2>
    {subtitle && (
      <p className="prose-headline-lg-regular text-base-content">{subtitle}</p>
    )}
  </div>
)

const InfoBoxIcon = ({ icon }: { icon?: SupportedIconName }) => {
  if (!icon) return null
  const Icon = SUPPORTED_ICONS_MAP[icon]
  return (
    <Icon className="h-auto w-6 text-base-content-strong group-hover:text-brand-interaction" />
  )
}

export const infoColTitleStyle = tv({
  extend: groupFocusVisibleHighlightNonRac,
  base: "prose-headline-lg-semibold text-base-content-strong group-hover:text-brand-interaction",
})

const InfoBoxes = ({
  infoBoxes,
  LinkComponent,
}: Pick<InfoColsProps, "infoBoxes" | "LinkComponent">) => {
  return (
    <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2 md:gap-y-12 lg:grid-cols-3">
      {infoBoxes.map(
        ({ title, icon, description, buttonUrl, buttonLabel }, idx) => (
          <Link
            LinkComponent={LinkComponent}
            href={buttonUrl}
            key={idx}
            className="group flex flex-col items-start gap-3 text-left outline-0"
          >
            {icon && <InfoBoxIcon icon={icon} aria-hidden="true" />}
            <h3 className={infoColTitleStyle()}>{title}</h3>
            {description && (
              <p className="prose-body-base text-base-content">{description}</p>
            )}
            {buttonLabel && buttonUrl && (
              <div className="prose-headline-base-medium inline-flex items-center gap-1 text-base-content-strong">
                {buttonLabel}
                <BiRightArrowAlt className="text-[1.375rem] transition ease-in group-hover:translate-x-1" />
              </div>
            )}
          </Link>
        ),
      )}
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
      <div className={`${ComponentContent} py-12 md:py-16`}>
        <div className="flex flex-col gap-12">
          <InfoColsHeader title={title} subtitle={subtitle} />
          <InfoBoxes infoBoxes={infoBoxes} LinkComponent={LinkComponent} />
        </div>
      </div>
    </section>
  )
}

export default InfoCols

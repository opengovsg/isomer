import { BiRightArrowAlt } from "react-icons/bi"

import type { SupportedIconName } from "~/common/icons"
import type { InfoColsProps } from "~/interfaces"
import { SUPPORTED_ICONS_MAP } from "~/common/icons"
import { tv } from "~/lib/tv"
import {
  getReferenceLinkHref,
  getTailwindVariantLayout,
  groupFocusVisibleHighlight,
  isExternalUrl,
} from "~/utils"
import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const createInfoColsStyles = tv({
  slots: {
    section: "bg-white",
    outerContainer: `${ComponentContent}`,
    innerContainer: "flex flex-col gap-12",
    header: "flex w-full max-w-[47.5rem] flex-col items-start text-left",
    headerTitle: "prose-display-md break-words text-base-content-strong",
    headerSubtitle: "prose-headline-lg-regular text-base-content",
    infoBoxesContainer:
      "grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2 md:gap-y-12 lg:grid-cols-3",
    infoBox: "group flex flex-col items-start gap-3 text-left outline-0",
    infoBoxIcon: "h-auto w-6 text-base-content-strong",
    infoBoxTitle: [
      groupFocusVisibleHighlight(),
      "prose-headline-lg-semibold text-base-content-strong",
    ],
    infoBoxDescription: "prose-body-base text-base-content",
    infoBoxButton:
      "prose-headline-base-medium items-center gap-1 text-base-content-strong",
    infoBoxButtonIcon:
      "ml-1 inline text-[1.375rem] transition ease-in group-hover:translate-x-1",
  },
  variants: {
    layout: {
      homepage: {
        outerContainer: "py-12 md:py-16",
        header: "gap-2.5",
        headerSubtitle: "prose-headline-lg-regular",
      },
      default: {
        outerContainer: "mt-14",
        header: "gap-6",
        headerSubtitle: "prose-body-base",
      },
    },
    isExternalLink: {
      true: {
        infoBoxButtonIcon: "rotate-[-45deg]",
      },
    },
    hasLink: {
      true: {
        infoBoxTitle: "group-hover:text-brand-interaction",
        infoBoxIcon: "group-hover:text-brand-interaction",
      },
    },
  },
  defaultVariants: {
    layout: "default",
  },
})

const compoundStyles = createInfoColsStyles()

const InfoBoxIcon = ({
  icon,
  hasLink,
}: {
  icon?: SupportedIconName
  hasLink: boolean
}) => {
  if (!icon) return null

  const Icon = SUPPORTED_ICONS_MAP[icon]

  return (
    <Icon
      className={compoundStyles.infoBoxIcon({
        hasLink,
      })}
    />
  )
}

const InfoBoxes = ({
  infoBoxes,
  site,
  LinkComponent,
}: Pick<InfoColsProps, "infoBoxes" | "site" | "LinkComponent">) => {
  return (
    <div className={compoundStyles.infoBoxesContainer()}>
      {infoBoxes.map(
        ({ title, icon, description, buttonUrl, buttonLabel }, idx) => {
          const hasLink = !!buttonUrl
          const isExternalLink = isExternalUrl(buttonUrl)
          return (
            <Link
              LinkComponent={LinkComponent}
              href={getReferenceLinkHref(
                buttonUrl,
                site.siteMap,
                site.assetsBaseUrl,
              )}
              key={idx}
              className={compoundStyles.infoBox()}
              isExternal={isExternalLink}
            >
              {icon && (
                <InfoBoxIcon icon={icon} hasLink={hasLink} aria-hidden="true" />
              )}

              <h3
                className={compoundStyles.infoBoxTitle({
                  hasLink,
                })}
              >
                {title}
              </h3>

              {description && (
                <p className={compoundStyles.infoBoxDescription()}>
                  {description}
                </p>
              )}

              {buttonLabel && hasLink && (
                <h3 className={compoundStyles.infoBoxButton()}>
                  {buttonLabel}
                  <BiRightArrowAlt
                    className={compoundStyles.infoBoxButtonIcon({
                      isExternalLink,
                    })}
                  />
                </h3>
              )}
            </Link>
          )
        },
      )}
    </div>
  )
}

const InfoCols = ({
  id,
  title,
  subtitle,
  infoBoxes,
  layout,
  site,
  LinkComponent,
}: InfoColsProps) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)

  return (
    <section id={id} className={compoundStyles.section()}>
      <div
        className={compoundStyles.outerContainer({ layout: simplifiedLayout })}
      >
        <div className={compoundStyles.innerContainer()}>
          <div className={compoundStyles.header({ layout: simplifiedLayout })}>
            <h2 className={compoundStyles.headerTitle()}>{title}</h2>

            {subtitle && (
              <p
                className={compoundStyles.headerSubtitle({
                  layout: simplifiedLayout,
                })}
              >
                {subtitle}
              </p>
            )}
          </div>

          <InfoBoxes
            infoBoxes={infoBoxes}
            site={site}
            LinkComponent={LinkComponent}
          />
        </div>
      </div>
    </section>
  )
}

export default InfoCols

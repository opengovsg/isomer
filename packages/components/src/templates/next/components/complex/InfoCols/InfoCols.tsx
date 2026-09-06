import type { SupportedIconName } from "~/common/icons"
import type { InfoColsProps } from "~/interfaces"
import { createElement } from "react"
import { BiRightArrowAlt } from "react-icons/bi"
import { SUPPORTED_ICONS_MAP } from "~/common/icons"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

import { ComponentContent } from "../../internal/customCssClass"
import { Link } from "../../internal/Link"

const createInfoColsStyles = tv({
  defaultVariants: {
    layout: "default",
  },
  slots: {
    header: "flex w-full max-w-[47.5rem] flex-col items-start text-left",
    headerSubtitle: "prose-headline-lg-regular text-base-content",
    headerTitle: "prose-display-sm break-words text-base-content-strong",
    infoBox: "group flex flex-col items-start gap-3 text-left outline-0",
    infoBoxButton:
      "prose-headline-base-medium items-center gap-1 text-base-content-strong",
    infoBoxButtonIcon:
      "mb-0.5 ml-1 inline text-[1.375rem] transition ease-in group-hover:translate-x-1",
    infoBoxDescription: "prose-body-base text-base-content",
    infoBoxIcon: "h-auto w-6 text-base-content-strong",
    infoBoxTitle: [
      groupFocusVisibleHighlight(),
      "prose-headline-lg-semibold text-base-content-strong",
    ],
    infoBoxesContainer:
      "grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2 md:gap-y-12 lg:grid-cols-3",
    innerContainer: "flex flex-col gap-12",
    outerContainer: ComponentContent,
    section: "bg-white",
  },
  variants: {
    hasLink: {
      true: {
        infoBoxIcon: "group-hover:text-brand-interaction",
        infoBoxTitle: "group-hover:text-brand-interaction",
      },
    },
    isExternalLink: {
      true: {
        infoBoxButtonIcon: "rotate-[-45deg]",
      },
    },
    layout: {
      default: {
        header: "gap-6",
        headerSubtitle: "prose-body-base",
        outerContainer: "mt-14",
      },
      homepage: {
        header: "gap-2.5",
        headerSubtitle: "prose-headline-lg-regular",
        outerContainer: "py-12 md:py-16",
      },
    },
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
  if (!icon) {return null}

  const Icon = SUPPORTED_ICONS_MAP[icon]

  return (
    <Icon
      aria-hidden
      className={compoundStyles.infoBoxIcon({
        hasLink,
      })}
    />
  )
}

const InfoBoxes = ({
  infoBoxes,
  site,
}: Pick<InfoColsProps, "infoBoxes" | "site">) => 
  (
    <div className={compoundStyles.infoBoxesContainer()}>
      {infoBoxes.map(({ title, icon, description, buttonUrl, buttonLabel }) => {
        const hasLink = !!buttonUrl
        const isExternalLink = isExternalUrl(buttonUrl)
        const showTitleArrow = hasLink && !buttonLabel
        return (
          <Link
            href={getReferenceLinkHref(
              buttonUrl,
              site.siteMapArray,
              site.assetsBaseUrl,
            )}
            key={`${title}-${buttonUrl ?? ""}`}
            className={compoundStyles.infoBox()}
            isExternal={isExternalLink}
          >
            {icon && <InfoBoxIcon icon={icon} hasLink={hasLink} />}

            <h3
              className={compoundStyles.infoBoxTitle({
                hasLink,
              })}
            >
              {title}
              {showTitleArrow && (
                <BiRightArrowAlt
                  aria-hidden
                  className={compoundStyles.infoBoxButtonIcon({
                    isExternalLink,
                  })}
                />
              )}
            </h3>

            {description && (
              <p className={compoundStyles.infoBoxDescription()}>
                {description}
              </p>
            )}

            {hasLink && !showTitleArrow && (
              <div className={compoundStyles.infoBoxButton()}>
                {buttonLabel}
                <BiRightArrowAlt
                  className={compoundStyles.infoBoxButtonIcon({
                    isExternalLink,
                  })}
                />
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )


export const InfoCols = ({
  id,
  title,
  subtitle,
  infoBoxes,
  layout,
  site,
  headingLevel,
}: InfoColsProps) => {
  const simplifiedLayout = getTailwindVariantLayout(layout)
  const Tag = getHeadingTag(headingLevel)

  return (
    <section id={id} className={compoundStyles.section()}>
      <div
        className={compoundStyles.outerContainer({ layout: simplifiedLayout })}
      >
        <div className={compoundStyles.innerContainer()}>
          <div className={compoundStyles.header({ layout: simplifiedLayout })}>
            {createElement(
              Tag,
              { className: compoundStyles.headerTitle() },
              title,
            )}

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

          <InfoBoxes infoBoxes={infoBoxes} site={site} />
        </div>
      </div>
    </section>
  )
}

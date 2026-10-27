import type { SupportedIconName } from "~/common/icons"
import type { HeroGradientQuickLinksProps } from "~/interfaces/complex/Hero"
import { BiRightArrowAlt } from "react-icons/bi"
import { SUPPORTED_ICONS_MAP } from "~/common/icons"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

import { Link } from "../../../../internal/Link"

const createStyles = tv({
  slots: {
    root: "group flex flex-col items-start gap-3 text-left outline-0",
    icon: "h-auto w-6 text-base-content-strong group-hover:text-brand-interaction",
    title: [
      groupFocusVisibleHighlight(),
      "prose-headline-lg-semibold text-base-content-strong",
    ],
    description: "prose-body-base text-base-content",
    button:
      "prose-headline-base-medium items-center gap-1 text-base-content-strong",
    buttonIcon:
      "mb-0.5 ml-1 inline text-[1.375rem] transition ease-in group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0",
  },
  variants: {
    isExternalLink: {
      true: {
        buttonIcon: "rotate-[-45deg]",
      },
    },
    hasLink: {
      true: {
        title: "group-hover:text-brand-interaction",
      },
    },
  },
})

const styles = createStyles()

const ItemIcon = ({ icon }: { icon: SupportedIconName }) => {
  const Icon = SUPPORTED_ICONS_MAP[icon]

  return <Icon aria-hidden className={styles.icon()} />
}

interface QuickLinksItemProps {
  item: HeroGradientQuickLinksProps["actions"]["items"][number]
  showIcon: HeroGradientQuickLinksProps["actions"]["showIcon"]
  site: HeroGradientQuickLinksProps["site"]
  headingLevel: HeroGradientQuickLinksProps["headingLevel"]
}

export const QuickLinksItem = ({
  item,
  showIcon,
  site,
  headingLevel,
}: QuickLinksItemProps) => {
  const { title, icon, description, buttonUrl, buttonLabel } = item
  const trimmedTitle = title?.trim()
  const trimmedButtonLabel = buttonLabel?.trim()
  const hasLink = Boolean(buttonUrl)
  const isExternalLink = isExternalUrl(buttonUrl)
  const showTitleArrow = hasLink && !trimmedButtonLabel
  const TitleTag = getHeadingTag(headingLevel)

  return (
    <Link
      href={getReferenceLinkHref(
        buttonUrl,
        site.siteMapArray,
        site.assetsBaseUrl,
      )}
      className={styles.root()}
      isExternal={isExternalLink}
    >
      {showIcon ? <ItemIcon icon={icon} /> : null}

      {trimmedTitle ? (
        <TitleTag className={styles.title({ hasLink })}>
          {trimmedTitle}
          {showTitleArrow ? (
            <BiRightArrowAlt
              aria-hidden
              className={styles.buttonIcon({
                isExternalLink,
              })}
            />
          ) : null}
        </TitleTag>
      ) : null}

      {description ? (
        <p className={styles.description()}>{description}</p>
      ) : null}

      {hasLink && !showTitleArrow ? (
        <div className={styles.button()}>
          {trimmedButtonLabel}
          <BiRightArrowAlt
            aria-hidden
            className={styles.buttonIcon({
              isExternalLink,
            })}
          />
        </div>
      ) : null}
    </Link>
  )
}

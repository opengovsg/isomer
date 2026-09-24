import type { SupportedIconName } from "~/common/icons"
import type { HeroTaskTrayProps } from "~/interfaces/complex/Hero"
import { BiRightArrowAlt } from "react-icons/bi"
import { SUPPORTED_ICONS_MAP } from "~/common/icons"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

import { Link } from "../../../internal/Link"

const createStyles = tv({
  slots: {
    root: "group flex flex-col items-start gap-3 text-left outline-0",
    icon: "h-auto w-6 text-base-content-strong",
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
        icon: "group-hover:text-brand-interaction",
      },
    },
  },
})

const styles = createStyles()

const ItemIcon = ({ icon }: { icon: SupportedIconName }) => {
  const Icon = SUPPORTED_ICONS_MAP[icon]

  return <Icon aria-hidden className={styles.icon({ hasLink: true })} />
}

interface TaskTrayItemProps {
  item: HeroTaskTrayProps["taskTrayItems"][number]
  itemIndex: number
  site: HeroTaskTrayProps["site"]
  headingLevel: HeroTaskTrayProps["headingLevel"]
}

export const TaskTrayItem = ({
  item,
  itemIndex,
  site,
  headingLevel,
}: TaskTrayItemProps) => {
  const { title, icon, description, buttonUrl, buttonLabel } = item
  const isExternalLink = isExternalUrl(buttonUrl)
  const TitleTag = getHeadingTag(headingLevel)
  const titleId = `hero-task-tray-item-${itemIndex}-title`
  const descriptionId = `hero-task-tray-item-${itemIndex}-description`

  return (
    <Link
      href={getReferenceLinkHref(
        buttonUrl,
        site.siteMapArray,
        site.assetsBaseUrl,
      )}
      className={styles.root()}
      isExternal={isExternalLink}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <ItemIcon icon={icon} />

      <TitleTag id={titleId} className={styles.title({ hasLink: true })}>
        {title}
      </TitleTag>

      {description ? (
        <p id={descriptionId} className={styles.description()}>
          {description}
        </p>
      ) : null}

      <div className={styles.button()} aria-hidden>
        {buttonLabel}
        <BiRightArrowAlt
          aria-hidden
          className={styles.buttonIcon({
            isExternalLink,
          })}
        />
      </div>
    </Link>
  )
}

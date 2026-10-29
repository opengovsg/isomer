import type { StepsProps } from "~/interfaces"
import type { IsomerSiteProps } from "~/types"
import { BiRightArrowAlt } from "react-icons/bi"
import { tv } from "~/lib/tv"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { groupFocusVisibleHighlight } from "~/utils/tailwind"

import { Link } from "../../internal/Link"

const createStepStyles = tv({
  slots: {
    // min-w-0 lets the grid column shrink below a long unbroken string.
    // Without it, min-width: auto grows the column and the text spills out.
    listItem: "flex min-w-0",
    // container needs w-full. As a flex child of <li>, a short step shrinks to
    // its content width instead of filling the grid column. min-w-0 + break-words
    // keep a long title or description inside that column.
    container:
      "group flex h-full w-full min-w-0 flex-col items-start gap-3 break-words text-left outline-0",
    number: "text-base-content-subtle",
    title: [
      groupFocusVisibleHighlight(),
      // max-w-full + min-w-0: items-start sizes the heading to its text, so an
      // unbroken string would otherwise ignore the card width.
      "prose-headline-lg-semibold min-w-0 max-w-full break-words text-base-content-strong",
    ],
    description:
      "prose-body-base min-w-0 max-w-full break-words text-base-content",
    button:
      "prose-headline-base-medium inline-flex items-center gap-1 pt-1 text-base-content-strong group-hover:text-brand-interaction",
    buttonIcon:
      "mb-0.5 ml-1 inline text-[1.375rem] transition ease-in group-hover:translate-x-1",
  },
  variants: {
    // numeral has no card border. eyebrow and badge do.
    numberStyle: {
      numeral: {
        number: "prose-display-md text-base-content-strong",
      },
      eyebrow: {
        container: "rounded-lg border border-base-divider-medium p-6",
        number: "prose-headline-base-medium",
      },
      badge: {
        container: "rounded-lg border border-base-divider-medium p-6",
        number:
          "prose-display-xs flex h-11 w-11 items-center justify-center rounded-md bg-brand-canvas text-base-content-strong",
      },
    },
    isExternalLink: {
      true: {
        buttonIcon: "rotate-[-45deg]",
      },
    },
    // Hover colour on the CTA. Without a CTA label, the title gets it because
    // the arrow sits there.
    hasTitleArrow: {
      true: {
        title: "group-hover:text-brand-interaction",
      },
    },
  },
  defaultVariants: {
    numberStyle: "numeral",
  },
})

const styles = createStepStyles()

type StepProps = StepsProps["steps"][number] & {
  index: number
  numberStyle: StepsProps["numberStyle"]
  headingLevel: number
  site: IsomerSiteProps
}

export const Step = ({
  index,
  title,
  description,
  buttonLabel,
  buttonUrl,
  numberStyle,
  headingLevel,
  site,
}: StepProps) => {
  const TitleTag = getHeadingTag(headingLevel)
  const href = getReferenceLinkHref(
    buttonUrl,
    site.siteMapArray,
    site.assetsBaseUrl,
  )
  const hasLink = !!href
  const isExternalLink = isExternalUrl(href)
  const showTitleArrow = hasLink && !buttonLabel
  const containerClassName = styles.container({ numberStyle })

  const content = (
    <>
      <span aria-hidden className={styles.number({ numberStyle })}>
        {index + 1}
      </span>

      <TitleTag
        className={styles.title({
          hasTitleArrow: showTitleArrow,
        })}
      >
        {title}
        {showTitleArrow && (
          <BiRightArrowAlt
            aria-hidden
            className={styles.buttonIcon({
              isExternalLink,
            })}
          />
        )}
      </TitleTag>

      {description && <p className={styles.description()}>{description}</p>}

      {hasLink && !showTitleArrow && (
        <div className={styles.button()}>
          {buttonLabel}
          <BiRightArrowAlt
            aria-hidden
            className={styles.buttonIcon({
              isExternalLink,
            })}
          />
        </div>
      )}
    </>
  )

  return (
    <li className={styles.listItem()}>
      {href ? (
        <Link
          href={href}
          className={containerClassName}
          isExternal={isExternalLink}
        >
          {content}
        </Link>
      ) : (
        <div className={containerClassName}>{content}</div>
      )}
    </li>
  )
}

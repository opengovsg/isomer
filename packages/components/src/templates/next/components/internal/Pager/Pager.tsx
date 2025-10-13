import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi"

import type { PagerProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Link } from "../Link"

const pagerStyles = tv({
  base: "flex flex-col gap-4 sm:flex-row sm:gap-6",
  slots: {
    link: "group flex flex-1 flex-row items-center gap-2 rounded-md border border-divider-medium p-4",
    label: "group prose-label-sm-medium text-base-content-light",
    linkText:
      "group prose-headline-base-medium text-base-content group-hover:underline",
    icon: "prose-title-lg-medium text-base-content",
    previousLinkAlignment: "text-left sm:text-right",
  },
  variants: {
    alignment: {
      previous: {
        link: "justify-start sm:justify-between",
      },
      next: {
        link: "justify-between",
      },
    },
  },
})
const compoundStyles = pagerStyles()

export const Pager = ({
  previousPage,
  nextPage,
  LinkComponent,
}: PagerProps): JSX.Element => {
  return (
    <div className={compoundStyles.base()}>
      {previousPage && (
        <Link
          href={previousPage.url}
          LinkComponent={LinkComponent}
          className={compoundStyles.link({ alignment: "previous" })}
        >
          <BiLeftArrowAlt className={compoundStyles.icon()} />
          <div className={compoundStyles.previousLinkAlignment()}>
            <p className={compoundStyles.label()}>Previous page</p>
            <p className={compoundStyles.linkText()}>{previousPage.title}</p>
          </div>
        </Link>
      )}
      {nextPage && (
        <Link
          href={nextPage.url}
          LinkComponent={LinkComponent}
          className={compoundStyles.link({ alignment: "next" })}
        >
          <div>
            <p className={compoundStyles.label()}>Next page</p>
            <p className={compoundStyles.linkText()}>{nextPage.title}</p>
          </div>
          <BiRightArrowAlt className={compoundStyles.icon()} />
        </Link>
      )}
    </div>
  )
}

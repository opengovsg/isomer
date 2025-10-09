import { BiLeftArrowAlt, BiRightArrowAlt } from "react-icons/bi"

import type { PagerProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Link } from "../Link"

const pagerContainerStyle = tv({
  base: "flex flex-col gap-4 sm:flex-row sm:gap-6",
})

const pagerLinkStyle = tv({
  base: "group flex flex-1 flex-row items-center gap-2 rounded-md border border-divider-medium p-4",
  variants: {
    alignment: {
      previous: "justify-start sm:justify-between",
      next: "justify-between",
    },
  },
})

const labelStyle = tv({
  base: "group prose-label-sm-medium text-base-content-light",
})

const linkTextStyle = tv({
  base: "group prose-headline-base-medium text-base-content group-hover:underline",
})

const previousLinkAlignment = tv({
  base: "text-left sm:text-right",
})

const iconStyle = tv({
  base: "prose-title-lg-medium text-base-content",
})

export const Pager = ({
  previousPage,
  nextPage,
  LinkComponent,
}: PagerProps): JSX.Element => {
  return (
    <div className={pagerContainerStyle()}>
      {previousPage && (
        <Link
          href={previousPage.url}
          LinkComponent={LinkComponent}
          className={pagerLinkStyle({ alignment: "previous" })}
        >
          <BiLeftArrowAlt className={iconStyle()} />
          <div className={previousLinkAlignment()}>
            <p className={labelStyle()}>Previous page</p>
            <p className={linkTextStyle()}>{previousPage.title}</p>
          </div>
        </Link>
      )}
      {nextPage && (
        <Link
          href={nextPage.url}
          LinkComponent={LinkComponent}
          className={pagerLinkStyle({ alignment: "next" })}
        >
          <div>
            <p className={labelStyle()}>Next page</p>
            <p className={linkTextStyle()}>{nextPage.title}</p>
          </div>
          <BiRightArrowAlt className={iconStyle()} />
        </Link>
      )}
    </div>
  )
}

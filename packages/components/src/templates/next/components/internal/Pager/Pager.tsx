import type { PagerProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { Link } from "../Link"

const pagerContainerStyle = tv({
  base: "flex flex-col gap-4 md:flex-row md:gap-6",
})

const pagerLinkStyle = tv({
  base: "group flex grow flex-col gap-1 rounded-md border border-divider-medium p-4",
})

const labelStyle = tv({
  base: "group prose-label-sm-medium text-base-content-light",
})

const linkTextStyle = tv({
  base: "group prose-headline-base-medium text-base-content group-hover:underline",
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
          className={pagerLinkStyle()}
        >
          <p className={labelStyle()}>Previous page</p>
          <p className={linkTextStyle()}>← {previousPage.title}</p>
        </Link>
      )}
      {nextPage && (
        <Link
          href={nextPage.url}
          LinkComponent={LinkComponent}
          className={pagerLinkStyle()}
        >
          <p className={labelStyle()}>Next page</p>
          <p className={linkTextStyle()}>{nextPage.title} →</p>
        </Link>
      )}
    </div>
  )
}

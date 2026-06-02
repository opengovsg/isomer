import type { SiderailProps } from "~/interfaces"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/tailwind"

import type { Item } from "./types"
import { Link } from "../Link"

const MAX_SIBLINGS_LIMIT = 10

const createSiderailStyles = tv({
  slots: {
    container: "flex flex-col items-start gap-16",
    parentContainer: "flex flex-col items-start gap-3 self-stretch",
    sectionLabel: "prose-label-sm-medium text-base-content-light",
    parentLabel:
      "group prose-headline-base-medium text-base-content line-clamp-3 transition",
    contentContainer: "flex flex-col items-start gap-3 self-stretch",
    siblingsContainer: "flex flex-col items-start gap-4 self-stretch",
    siblingsList: "line-clamp-2 flex flex-col gap-3 self-stretch",
    sibling: "flex shrink-0 grow-1 basis-0 items-center justify-between",
    label:
      "group prose-body-base text-base-content hover:text-brand-interaction flex w-full flex-row transition",
    rightArrowIcon:
      "-mr-2 h-6 w-6 shrink-0 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100",
    seeAllContainer:
      "mt-1 flex shrink-0 grow-1 basis-0 items-center justify-between",
    seeAllLink: "prose-label-md-regular",
  },
})

const compoundStyles = createSiderailStyles()

const parentLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "underline-offset-4 hover:underline",
})

const siblingLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "w-fit overflow-hidden text-ellipsis underline-offset-4 hover:underline",
})

const seeAllLinkStyle = tv({
  extend: focusVisibleHighlight,
  base: "text-link underline-offset-4 hover:underline",
})

const generateSiderailItems = (items: Item[]): JSX.Element[] => {
  return items
    .filter((item) => !item.isCurrent)
    .slice(0, MAX_SIBLINGS_LIMIT)
    .map(({ url, title }, index) => (
      <li key={index} className={compoundStyles.sibling()}>
        <p className={compoundStyles.label()}>
          <Link href={url} className={siblingLinkStyle()}>
            {title}
          </Link>
        </p>
      </li>
    ))
}

export const Siderail = ({
  parentTitle,
  parentUrl,
  pages,
}: SiderailProps): JSX.Element => {
  const siderailItems = generateSiderailItems(pages)

  return (
    <nav className="text-base-content" role="navigation">
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.parentContainer()}>
          <p className={compoundStyles.sectionLabel()}>Back to</p>
          <p className={compoundStyles.parentLabel()}>
            <Link href={parentUrl} className={parentLinkStyle()}>
              {parentTitle}
            </Link>
          </p>
        </div>

        {siderailItems.length > 0 && (
          <div className={compoundStyles.contentContainer()}>
            <div className={compoundStyles.siblingsContainer()}>
              <h2 className={compoundStyles.sectionLabel()}>
                Other pages in{" "}
                <span className="text-base-content-medium">{parentTitle}</span>
              </h2>

              <ul className={compoundStyles.siblingsList()}>{siderailItems}</ul>
            </div>

            <div className={compoundStyles.seeAllContainer()}>
              <p className={compoundStyles.seeAllLink()}>
                <Link href={parentUrl} className={seeAllLinkStyle()}>
                  See all pages
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

import type { Item } from "./types"
import type { SiderailProps } from "~/interfaces"
import type { LinkComponentType } from "~/types"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils"
import { Link } from "../Link"

const MAX_SIBLINGS_LIMIT = 10

const createSiderailStyles = tv({
  slots: {
    container: "flex flex-col items-start gap-16",
    parentContainer: "flex flex-col items-start gap-3 self-stretch",
    sectionLabel: "prose-label-sm-medium text-base-content-light",
    parentLabel:
      "group prose-headline-base-medium line-clamp-3 text-base-content transition",
    contentContainer: "flex flex-col items-start gap-3 self-stretch",
    siblingsContainer: "flex flex-col items-start gap-4 self-stretch",
    siblingsList: "line-clamp-2 flex flex-col gap-3 self-stretch",
    sibling:
      "flex-grow-1 flex flex-shrink-0 basis-0 items-center justify-between",
    label:
      "group prose-body-base flex w-full flex-row text-base-content transition hover:text-brand-interaction",
    rightArrowIcon:
      "-mr-2 h-6 w-6 shrink-0 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100",
    seeAllContainer:
      "flex-grow-1 mt-1 flex flex-shrink-0 basis-0 items-center justify-between",
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

const generateSiderailItems = (
  items: Item[],
  LinkComponent: LinkComponentType,
): JSX.Element[] => {
  return items
    .filter((item) => !item.isCurrent)
    .slice(0, MAX_SIBLINGS_LIMIT)
    .map(({ url, title }, index) => (
      <li key={index} className={compoundStyles.sibling()}>
        <p className={compoundStyles.label()}>
          <Link
            LinkComponent={LinkComponent}
            href={url}
            className={siblingLinkStyle()}
          >
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
  LinkComponent,
}: SiderailProps): JSX.Element => {
  const siderailItems = generateSiderailItems(pages, LinkComponent)

  return (
    <nav className="text-base-content" role="navigation">
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.parentContainer()}>
          <p className={compoundStyles.sectionLabel()}>Back to</p>
          <p className={compoundStyles.parentLabel()}>
            <Link
              href={parentUrl}
              LinkComponent={LinkComponent}
              className={parentLinkStyle()}
            >
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
                <Link
                  href={parentUrl}
                  LinkComponent={LinkComponent}
                  className={seeAllLinkStyle()}
                >
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

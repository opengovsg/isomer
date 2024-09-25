"use client"

import { useMemo } from "react"
import { composeRenderProps } from "react-aria-components"

import type { Item } from "./types"
import type { SiderailProps } from "~/interfaces"
import type { LinkComponentType } from "~/types"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight } from "~/utils/rac"
import { Link } from "../Link"

const MAX_SIBLINGS_LIMIT = 10

const createSiderailStyles = tv({
  slots: {
    container: "flex flex-col items-start gap-8",
    parentContainer: "flex flex-col items-start gap-2 self-stretch",
    sectionLabel:
      "text-[0.625rem] font-semibold uppercase leading-4 tracking-[0.8px] text-base-content-subtle",
    parentLabel:
      "flex-grow-1 group prose-headline-lg-medium flex flex-shrink-0 basis-0 text-base-content transition",
    contentContainer: "flex flex-col items-start gap-3 self-stretch",
    siblingsContainer: "flex flex-col items-start gap-0.5 self-stretch",
    sibling:
      "flex-grow-1 flex flex-shrink-0 basis-0 items-center justify-between py-2",
    label:
      "group prose-body-base flex w-full flex-row text-base-content transition hover:text-brand-interaction",
    rightArrowIcon:
      "-mr-2 h-6 w-6 shrink-0 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100",
    seeAllContainer:
      "flex-grow-1 flex flex-shrink-0 basis-0 items-center justify-between py-2",
    seeAllLink: "prose-body-base overflow-hidden text-ellipsis",
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
            className={composeRenderProps("", (className, renderProps) =>
              siblingLinkStyle({
                className,
                ...renderProps,
              }),
            )}
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
  const siderailItems = useMemo(
    () => generateSiderailItems(pages, LinkComponent),
    [pages],
  )

  return (
    <nav className="text-base-content" role="navigation">
      <div className={compoundStyles.container()}>
        <div className={compoundStyles.parentContainer()}>
          <p className={compoundStyles.sectionLabel()}>Back to</p>
          <p className={compoundStyles.parentLabel()}>
            <Link
              href={parentUrl}
              LinkComponent={LinkComponent}
              className={composeRenderProps("", (className, renderProps) =>
                parentLinkStyle({
                  className,
                  ...renderProps,
                }),
              )}
            >
              {parentTitle}
            </Link>
          </p>
        </div>

        {siderailItems.length > 0 && (
          <div className={compoundStyles.contentContainer()}>
            <div className={compoundStyles.siblingsContainer()}>
              <h2 className={compoundStyles.sectionLabel()}>
                Other pages in {parentTitle}
              </h2>

              <ul className="self-stretch">{siderailItems}</ul>
            </div>

            <div className={compoundStyles.seeAllContainer()}>
              <p className={compoundStyles.seeAllLink()}>
                <Link
                  href={parentUrl}
                  LinkComponent={LinkComponent}
                  className={composeRenderProps("", (className, renderProps) =>
                    seeAllLinkStyle({
                      className,
                      ...renderProps,
                    }),
                  )}
                >
                  See all pages in {parentTitle}
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

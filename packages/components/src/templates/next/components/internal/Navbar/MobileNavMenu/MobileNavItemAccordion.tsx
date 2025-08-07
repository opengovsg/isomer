import { BiChevronDown, BiRightArrowAlt } from "react-icons/bi"

import type { NavbarItemProps, NavbarProps } from "~/interfaces/internal/Navbar"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight, isExternalUrl } from "~/utils"
import { Link } from "../../Link"

interface NavItemAccordionProps
  extends NavbarItemProps,
    Pick<NavbarProps, "LinkComponent"> {
  isOpen: boolean
  onClick: () => void
  index: number
}

interface ParentItemLinkProps
  extends Pick<NavItemAccordionProps, "name" | "url" | "LinkComponent"> {
  isExternal: boolean
}

const mobileItemStyles = tv({
  slots: {
    container: "flex flex-col gap-3 border-b border-b-base-divider-subtle",
    menuItemsContainer: "",
    item: "group prose-headline-base-medium flex w-full items-center px-6 py-3 text-left text-base-content outline-0",
    sublist: "flex w-full flex-col gap-3.5",
    nestedItem: "prose-body-base text-base-content-medium",
    chevron:
      "text-[1.5rem] transition-transform duration-300 ease-in-out motion-reduce:transition-none",
  },
  variants: {
    isOpen: {
      true: {
        container: "pb-6",
        chevron: "-rotate-180",
        menuItemsContainer: "flex flex-col gap-6",
      },
      false: {
        menuItemsContainer: "hidden",
      },
    },
    itemType: {
      default: {
        item: "justify-between gap-6",
      },
      parentItem: {
        item: "gap-1",
        nestedItem: "flex items-center gap-1",
      },
    },
    withVerticalPadding: {
      true: {
        item: "py-1",
      },
    },
  },
  defaultVariants: {
    itemType: "default",
  },
})

const { item, chevron, container, nestedItem, sublist, menuItemsContainer } =
  mobileItemStyles()

const ParentItemLink = ({
  name,
  url,
  isExternal,
  LinkComponent,
}: ParentItemLinkProps) => {
  // This is a hack to ensure that the rightArrow is always at the end of the last word even on smaller screens
  const words = name.trim().split(" ")
  const allButLastWord = words.slice(0, -1).join(" ")
  const lastWord = words[words.length - 1]

  return (
    <div
      className={item({
        itemType: "parentItem",
        withVerticalPadding: true,
      })}
    >
      <Link
        LinkComponent={LinkComponent}
        isExternal={isExternalUrl(url)}
        showExternalIcon={isExternalUrl(url)}
        isWithFocusVisibleHighlight
        href={url}
        className={nestedItem({
          className: `group/parent-item ${focusVisibleHighlight()}`,
          itemType: "parentItem",
        })}
      >
        <span className="row-gap-0 flex flex-row flex-wrap items-baseline gap-1">
          Pages in
          {allButLastWord && (
            <span className="prose-headline-base-medium">{allButLastWord}</span>
          )}
          <span className="prose-headline-base-medium flex flex-row items-center gap-1">
            {lastWord}
            {!isExternal && (
              <BiRightArrowAlt
                aria-hidden
                className="text-[1rem] transition ease-in group-hover/parent-item:translate-x-1"
              />
            )}
          </span>
        </span>
      </Link>
    </div>
  )
}

export const MobileNavItemAccordion = ({
  name,
  url,
  items,
  isOpen,
  onClick,
  index,
  LinkComponent,
}: NavItemAccordionProps) => {
  if (!items || items.length === 0) {
    return (
      <div className={container()}>
        <Link
          isExternal={isExternalUrl(url)}
          LinkComponent={LinkComponent}
          className={item({
            className: focusVisibleHighlight(),
          })}
          href={url}
        >
          {name}
        </Link>
      </div>
    )
  }
  return (
    <section className={container({ isOpen })}>
      <div>
        <h2>
          <button
            id={`accordion-button-${index}`}
            aria-expanded={isOpen}
            aria-controls={`menu-content-${index}`}
            onClick={onClick}
            className={item({
              isOpen,
              className: focusVisibleHighlight(),
            })}
          >
            {name}
            <BiChevronDown className={chevron({ isOpen })} />
          </button>
        </h2>
      </div>
      <div
        id={`menu-content-${index}`}
        aria-labelledby={`accordion-button-${index}`}
        role="region"
        className={menuItemsContainer({ isOpen })}
      >
        <ul className={sublist()}>
          {items.map((subItem) => {
            const isExternal = isExternalUrl(subItem.url)
            return (
              <li key={subItem.name}>
                <div className={item({ withVerticalPadding: true })}>
                  <Link
                    LinkComponent={LinkComponent}
                    href={subItem.url}
                    isExternal={isExternal}
                    className={nestedItem({
                      className: focusVisibleHighlight(),
                    })}
                  >
                    {subItem.name}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
        {url && (
          <ParentItemLink
            name={name}
            url={url}
            isExternal={isExternalUrl(url)}
            LinkComponent={LinkComponent}
          />
        )}
      </div>
    </section>
  )
}

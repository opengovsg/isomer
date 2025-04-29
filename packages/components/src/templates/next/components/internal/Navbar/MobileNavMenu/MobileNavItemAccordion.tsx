import { BiChevronDown, BiRightArrowAlt } from "react-icons/bi"

import type { NavbarItem, NavbarProps } from "~/interfaces/internal/Navbar"
import { tv } from "~/lib/tv"
import { focusVisibleHighlight, isExternalUrl } from "~/utils"
import { Link } from "../../Link"

interface NavItemAccordionProps
  extends NavbarItem,
    Pick<NavbarProps, "LinkComponent"> {
  isOpen: boolean
  onClick: () => void
  index: number
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

export const MobileNavItemAccordion = ({
  name,
  url,
  referenceLinkHref,
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
          href={referenceLinkHref}
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
                    href={subItem.referenceLinkHref}
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
        {referenceLinkHref && (
          <div
            className={item({
              itemType: "parentItem",
              withVerticalPadding: true,
            })}
          >
            <Link
              LinkComponent={LinkComponent}
              isExternal={isExternalUrl(referenceLinkHref)}
              showExternalIcon={isExternalUrl(referenceLinkHref)}
              isWithFocusVisibleHighlight
              href={referenceLinkHref}
              className={nestedItem({
                className: `group/parent-item ${focusVisibleHighlight()}`,
                itemType: "parentItem",
              })}
            >
              <span>
                Pages in{" "}
                <span className="prose-headline-base-medium">{name}</span>
              </span>
              {!isExternalUrl(referenceLinkHref) && (
                <BiRightArrowAlt className="text-[1rem] transition ease-in group-hover/parent-item:translate-x-1" />
              )}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

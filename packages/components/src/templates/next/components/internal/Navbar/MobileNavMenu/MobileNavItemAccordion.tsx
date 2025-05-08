import { BiChevronDown } from "react-icons/bi"

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
    item: "group prose-headline-base-medium flex w-full items-center justify-between gap-6 px-6 py-3 text-left text-base-content outline-0",
    sublist: "flex flex-col gap-3.5",
    nestedItem: "prose-body-base text-base-content-medium",
    chevron:
      "text-[1.5rem] transition-transform duration-300 ease-in-out motion-reduce:transition-none",
  },
  variants: {
    isOpen: {
      true: {
        container: "pb-6",
        chevron: "-rotate-180",
      },
    },
  },
})

const { item, chevron, container, nestedItem, sublist } = mobileItemStyles()

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
        hidden={!isOpen}
        role="region"
      >
        <ul className={sublist()}>
          {items.map((subItem) => {
            const isExternal = isExternalUrl(subItem.url)
            return (
              <li key={subItem.name}>
                <div
                  className={item({
                    className: "py-1",
                  })}
                >
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
      </div>
    </section>
  )
}

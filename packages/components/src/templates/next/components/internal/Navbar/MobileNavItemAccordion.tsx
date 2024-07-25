import { BiChevronDown } from "react-icons/bi"
import { tv } from "tailwind-variants"

import type { NavbarItem, NavbarProps } from "~/interfaces/internal/Navbar"

interface NavItemAccordionProps
  extends NavbarItem,
    Pick<NavbarProps, "LinkComponent"> {
  isOpen: boolean
  onClick: () => void
  index: number
}

const mobileItemStyles = tv({
  slots: {
    container: "flex flex-col gap-6 border-b border-b-base-divider-subtle",
    item: "prose-headline-base-medium flex w-full justify-between gap-6 px-6 py-3 text-left text-base-content",
    sublist: "flex flex-col gap-3.5",
    nestedItem: "prose-body-base py-1 text-base-content-medium",
    chevron:
      "text-base transition-transform duration-300 ease-in-out motion-reduce:transition-none",
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
  items,
  isOpen,
  onClick,
  index,
  LinkComponent,
}: NavItemAccordionProps) => {
  if (!items || items.length === 0) {
    return (
      <div className={container()}>
        <LinkComponent className={item()} href={url}>
          {name}
        </LinkComponent>
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
            className={item({ isOpen })}
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
          {items.map((subItem) => (
            <li key={subItem.name}>
              {/* 44px */}
              <LinkComponent
                href={subItem.url}
                className={item({
                  className: nestedItem(),
                })}
              >
                {subItem.name}
              </LinkComponent>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

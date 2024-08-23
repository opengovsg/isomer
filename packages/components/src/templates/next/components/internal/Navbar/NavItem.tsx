import { forwardRef } from "react"
import { FocusOn } from "react-focus-on"
import { BiChevronDown, BiRightArrowAlt, BiX } from "react-icons/bi"

import type {
  NavbarItem as BaseNavbarItemProps,
  NavbarProps,
} from "~/interfaces/internal/Navbar"
import { tv } from "~/lib/tv"
import { IconButton } from "../IconButton"

interface NavbarItemProps
  extends BaseNavbarItemProps,
    Pick<NavbarProps, "LinkComponent"> {
  isOpen: boolean
  onClick: () => void
  onCloseMegamenu: () => void
}

const navbarItemStyles = tv({
  slots: {
    megamenu: "max-h-full overflow-auto bg-white shadow-md",
    item: "prose-label-md-medium flex h-[4.25rem] flex-row items-center border-b-2 border-transparent text-base-content-strong transition-colors hover:text-brand-interaction-hover motion-reduce:transition-none",
    chevron:
      "text-base transition-transform duration-300 ease-in-out motion-reduce:transition-none",
  },
  variants: {
    isOpen: {
      true: {
        item: "border-brand-interaction text-brand-interaction",
        chevron: "-rotate-180",
      },
    },
  },
})

const { item, chevron, megamenu } = navbarItemStyles()

export const NavItem = forwardRef<HTMLButtonElement, NavbarItemProps>(
  (
    {
      items,
      LinkComponent,
      name,
      url,
      description,
      isOpen,
      onClick,
      onCloseMegamenu,
    },
    ref,
  ): JSX.Element => {
    if (!items || items.length === 0) {
      return (
        <li>
          <LinkComponent className={item({ isOpen })} href={url}>
            {name}
          </LinkComponent>
        </li>
      )
    }

    return (
      <li>
        <button ref={ref} className={item({ isOpen })} onClick={onClick}>
          {name}
          <BiChevronDown className={chevron({ isOpen })} />
        </button>
        {isOpen && (
          <div className="absolute left-0 right-0 top-full">
            <div className="absolute bottom-0 left-0 right-0 top-full z-[1] h-screen bg-canvas-overlay/40" />
            <FocusOn
              onClickOutside={onCloseMegamenu}
              onEscapeKey={onCloseMegamenu}
            >
              <div className={megamenu()}>
                <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-8 px-10 pb-16 pt-12">
                  <div className="flex w-full flex-row items-start">
                    <div className="flex flex-col gap-1">
                      <h1 className="prose-display-sm text-base-content">
                        {name}
                      </h1>
                      {description && (
                        <p className="prose-label-sm-regular text-base-content-subtle">
                          {description}
                        </p>
                      )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    <IconButton
                      icon={BiX}
                      onPress={onCloseMegamenu}
                      aria-label="Close navigation item"
                    />
                  </div>

                  <ul className="grid grid-cols-3 gap-x-16 gap-y-8">
                    {items.map((subItem) => (
                      <li key={subItem.name}>
                        <div className="flex flex-col gap-1.5">
                          <LinkComponent
                            href={subItem.url}
                            className="prose-label-md-medium inline-flex items-center gap-1 text-base-content hover:underline"
                          >
                            {subItem.name}
                            <BiRightArrowAlt className="text-[1.25rem]" />
                          </LinkComponent>
                          <p className="prose-label-sm-regular text-base-content-subtle">
                            {subItem.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FocusOn>
          </div>
        )}
      </li>
    )
  },
)

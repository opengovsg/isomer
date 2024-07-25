import { forwardRef } from "react"
import { BiChevronDown, BiRightArrowAlt, BiX } from "react-icons/bi"
import { tv } from "tailwind-variants"

import type {
  NavbarItem as BaseNavbarItemProps,
  NavbarProps,
} from "~/interfaces/internal/Navbar"

interface NavbarItemProps
  extends BaseNavbarItemProps,
    Pick<NavbarProps, "LinkComponent"> {
  isOpen: boolean
  onClick: () => void
  onCloseMegamenu: () => void
  megaMenuRef: React.RefObject<HTMLDivElement>
}

const navbarItemStyles = tv({
  slots: {
    megamenu:
      "absolute left-0 top-[100%] z-20 w-full border-y border-y-gray-100 bg-white px-4",
    item: "flex flex-row px-2 py-1 align-middle text-base/5 font-medium text-neutral-800",
    chevron:
      "-mt-0.5 ml-1 inline text-2xl/6 transition-transform duration-300 ease-in-out",
  },
  variants: {
    isOpen: {
      true: {
        item: "text-[#766a62]",
        chevron: "rotate-180",
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
      megaMenuRef,
    },
    ref,
  ): JSX.Element => {
    if (!items || items.length === 0) {
      return (
        <li>
          <LinkComponent
            className="block px-2 py-1 text-base/5 font-medium text-[#1f2937]"
            href={url}
          >
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
          <div ref={megaMenuRef} className={megamenu()}>
            <div className="mx-auto flex w-full max-w-screen-xl flex-col py-12">
              <div className="mx-auto flex w-full max-w-container flex-row items-start px-10 pb-12">
                <div className="flex flex-col gap-1">
                  <h6 className="text-2xl font-semibold">{name}</h6>
                  {description && (
                    <p className="text-gray-700">{description}</p>
                  )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                <button
                  // onClick={() => setOpenNavItemIdx(-1)}
                  aria-label="Close navigation item"
                  className="text-sm text-content lg:text-base"
                >
                  Close
                  <BiX className="-mt-0.5 ml-1 inline text-2xl" />
                </button>
              </div>

              <div className="overflow-auto">
                <ul className="mx-auto flex w-full max-w-container flex-row flex-wrap gap-x-36 gap-y-8 px-10">
                  {items.map((subItem) => (
                    <li key={subItem.name} className="w-2/5">
                      <div className="flex flex-col gap-1">
                        <LinkComponent href={subItem.url}>
                          <p className="text-pretty text-lg font-semibold text-content hover:underline hover:underline-offset-2">
                            {subItem.name}
                            <BiRightArrowAlt className="-mt-0.5 inline h-auto w-5" />
                          </p>
                        </LinkComponent>
                        <p className="text-base text-gray-500">
                          {subItem.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </li>
    )
  },
)

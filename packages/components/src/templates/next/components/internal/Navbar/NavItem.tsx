"use client"

import { forwardRef } from "react"
import { FocusScope } from "react-aria"
import { BiChevronDown, BiRightArrowAlt, BiX } from "react-icons/bi"
import { useScrollLock } from "usehooks-ts"

import type {
  NavbarItem as BaseNavbarItemProps,
  NavbarItem,
  NavbarProps,
} from "~/interfaces/internal/Navbar"
import { tv } from "~/lib/tv"
import {
  focusVisibleHighlight,
  groupFocusVisibleHighlight,
  isExternalUrl,
} from "~/utils"
import { IconButton } from "../IconButton"
import { Link } from "../Link"

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
    item: "group prose-label-md-medium flex flex-row items-center gap-0.5 border-b-2 border-transparent pb-5 pt-6 text-base-content-strong outline-0 transition-colors hover:text-brand-interaction-hover motion-reduce:transition-none",
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
      referenceLinkHref,
      description,
      isOpen,
      onClick,
      onCloseMegamenu,
    },
    ref,
  ): JSX.Element => {
    if (!items || items.length === 0) {
      return (
        <li className={item({ isOpen })}>
          <Link
            LinkComponent={LinkComponent}
            isExternal={isExternalUrl(url)}
            showExternalIcon={isExternalUrl(url)}
            href={referenceLinkHref}
            className={focusVisibleHighlight()}
          >
            {name}
          </Link>
        </li>
      )
    }

    return (
      <li>
        <button ref={ref} className={item({ isOpen })} onClick={onClick}>
          <span className={groupFocusVisibleHighlight()}>{name}</span>
          <BiChevronDown className={chevron({ isOpen })} />
        </button>
        {isOpen && (
          <Megamenu
            name={name}
            description={description}
            referenceLinkHref={referenceLinkHref}
            items={items}
            LinkComponent={LinkComponent}
            onCloseMegamenu={onCloseMegamenu}
          />
        )}
      </li>
    )
  },
)

const Megamenu = ({
  name,
  description,
  referenceLinkHref,
  onCloseMegamenu,
  items,
  LinkComponent,
}: Pick<NavbarItem, "name" | "description" | "referenceLinkHref" | "items"> & {
  LinkComponent: NavbarProps["LinkComponent"]
  onCloseMegamenu: () => void
}) => {
  useScrollLock()

  const renderTitleContent = () => {
    if (!referenceLinkHref) {
      return name
    }

    const isExternal = isExternalUrl(referenceLinkHref)
    return (
      <Link
        LinkComponent={LinkComponent}
        isExternal={isExternal}
        showExternalIcon={isExternal}
        isWithFocusVisibleHighlight
        href={referenceLinkHref}
        className="group inline-flex w-fit items-center gap-1 hover:text-brand-interaction-hover hover:no-underline"
      >
        {name}
        {!isExternal && (
          <BiRightArrowAlt className="text-[1.5rem] transition ease-in group-hover:translate-x-1" />
        )}
      </Link>
    )
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50">
      <div
        className="absolute bottom-0 left-0 right-0 top-full z-[1] h-screen bg-canvas-overlay/40"
        onClick={onCloseMegamenu}
      />
      <FocusScope contain restoreFocus>
        <div className={megamenu()}>
          <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-8 px-10 pb-16 pt-12">
            <div className="flex w-full flex-row items-start">
              <div className="flex flex-col gap-1">
                <h2 className="prose-display-sm text-base-content">
                  {renderTitleContent()}
                </h2>
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
              {items.map((subItem) => {
                const isExternal = isExternalUrl(subItem.url)
                return (
                  <li key={subItem.name}>
                    <div className="flex flex-col gap-1.5">
                      <Link
                        LinkComponent={LinkComponent}
                        isExternal={isExternal}
                        showExternalIcon={isExternal}
                        isWithFocusVisibleHighlight
                        href={subItem.referenceLinkHref}
                        className="group prose-label-md-medium inline-flex w-fit items-center gap-1 text-base-content hover:text-brand-interaction-hover hover:no-underline"
                      >
                        {subItem.name}
                        {!isExternal && (
                          <BiRightArrowAlt className="text-[1.25rem] transition ease-in group-hover:translate-x-1" />
                        )}
                      </Link>
                      <p className="prose-label-sm-regular text-base-content-subtle">
                        {subItem.description}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </FocusScope>
    </div>
  )
}

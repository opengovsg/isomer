"use client"

import type { Dispatch, SetStateAction } from "react"
import { forwardRef } from "react"
import { FocusScope } from "react-aria"
import { Button } from "react-aria-components"
import { useScrollLock } from "usehooks-ts"

import type { NavbarClientProps } from "~/interfaces"
import { focusVisibleHighlight, isExternalUrl } from "~/utils"
import { Link } from "../../Link"
import { LinkButton } from "../../LinkButton/LinkButton"
import { MobileNavItemAccordion } from "./MobileNavItemAccordion"

type MobileNavMenuProps = Omit<
  NavbarClientProps,
  "layout" | "imageClientProps" | "ScriptComponent"
> & {
  top: number | undefined
  openNavItemIdx: number
  setOpenNavItemIdx: Dispatch<SetStateAction<number>>
  onCloseMenu: () => void
}

export const MobileNavMenu = forwardRef<HTMLDivElement, MobileNavMenuProps>(
  (
    {
      top,
      items,
      LinkComponent,
      openNavItemIdx,
      setOpenNavItemIdx,
      onCloseMenu,
      callToAction,
      utility,
    },
    mobileMenuRef,
  ) => {
    useScrollLock()

    return (
      <div
        ref={mobileMenuRef}
        className="fixed inset-0 z-50"
        style={{
          top,
        }}
      >
        <FocusScope contain restoreFocus>
          <div className="absolute inset-0 overflow-auto border-t border-t-base-divider-subtle bg-white">
            {!!callToAction && (
              <div className="border-y border-b-base-divider-subtle bg-base-canvas-alt px-6 py-3">
                <LinkButton
                  href={callToAction.url}
                  isExternal={isExternalUrl(callToAction.url)}
                  className="h-fit w-full justify-center"
                  isWithFocusVisibleHighlight
                  LinkComponent={LinkComponent}
                >
                  {callToAction.label}
                </LinkButton>
              </div>
            )}

            {items.map((item, index) => (
              <MobileNavItemAccordion
                key={`${item.name}-${index}`}
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                LinkComponent={LinkComponent}
                index={index}
                isOpen={index === openNavItemIdx}
                onClick={() =>
                  setOpenNavItemIdx((currIdx) =>
                    currIdx === index ? -1 : index,
                  )
                }
                {...item}
              />
            ))}

            {!!utility && (
              <div className="flex flex-col items-start gap-1 self-stretch bg-base-canvas-alt px-6 py-4">
                <p className="prose-label-sm-medium text-base-content-strong">
                  {utility.label || "Quick links"}
                </p>

                <ul className="flex flex-col gap-1">
                  {utility.items.map((item, index) => (
                    <li key={`${item.name}-${index}`}>
                      <Link
                        LinkComponent={LinkComponent}
                        className={focusVisibleHighlight({
                          className:
                            "prose-label-sm-medium py-1 text-base-content-subtle",
                        })}
                        href={item.url}
                        isExternal={isExternalUrl(item.url)}
                        showExternalIcon={isExternalUrl(item.url)}
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              className={focusVisibleHighlight({
                className:
                  "prose-headline-base-medium absolute -left-[100000px] flex h-[1px] w-[1px] items-center justify-between gap-6 overflow-hidden px-6 py-3 text-left text-base-content focus:static focus:h-auto focus:w-full",
              })}
              onPress={onCloseMenu}
            >
              Exit navigation menu
            </Button>
          </div>
        </FocusScope>
      </div>
    )
  },
)

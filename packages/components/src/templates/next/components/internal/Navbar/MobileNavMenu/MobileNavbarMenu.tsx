import type { Dispatch, SetStateAction } from "react"
import { forwardRef } from "react"
import { FocusScope } from "react-aria"
import { Button } from "react-aria-components"
import { useScrollLock } from "usehooks-ts"

import type { NavbarProps } from "~/interfaces"
import { focusVisibleHighlightNonRac } from "~/utils/rac"
import { MobileNavItemAccordion } from "./MobileNavItemAccordion"

interface MobileNavMenuProps
  extends Pick<NavbarProps, "items" | "LinkComponent"> {
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
        <FocusScope contain restoreFocus autoFocus>
          <div className="absolute inset-0 overflow-auto border-t border-t-base-divider-subtle bg-white">
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
            <Button
              className={focusVisibleHighlightNonRac({
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

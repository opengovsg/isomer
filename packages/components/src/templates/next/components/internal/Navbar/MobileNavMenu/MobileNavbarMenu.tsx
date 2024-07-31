import type { Dispatch, SetStateAction } from "react"
import { forwardRef } from "react"

import type { NavbarProps } from "~/interfaces"
import { MobileNavItemAccordion } from "./MobileNavItemAccordion"

interface MobileNavMenuProps
  extends Pick<NavbarProps, "items" | "LinkComponent"> {
  top: number | undefined
  openNavItemIdx: number
  setOpenNavItemIdx: Dispatch<SetStateAction<number>>
}

export const MobileNavMenu = forwardRef<HTMLDivElement, MobileNavMenuProps>(
  (
    { top, items, LinkComponent, openNavItemIdx, setOpenNavItemIdx },
    mobileMenuRef,
  ) => {
    return (
      <div
        ref={mobileMenuRef}
        className="fixed inset-0 z-50"
        style={{
          top,
        }}
      >
        <div className="absolute inset-0 overflow-auto border-t border-t-base-divider-subtle bg-white">
          {items.map((item, index) => (
            <MobileNavItemAccordion
              key={`${item.name}-${index}`}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              LinkComponent={LinkComponent}
              index={index}
              isOpen={index === openNavItemIdx}
              onClick={() =>
                setOpenNavItemIdx((currIdx) => (currIdx === index ? -1 : index))
              }
              {...item}
            />
          ))}
        </div>
      </div>
    )
  },
)
